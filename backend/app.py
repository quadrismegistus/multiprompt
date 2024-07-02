# app.py
from config import *
from llm_service import stream_llm_response



sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    with logmap('Client connection') as log:
        log.debug('Client connected:', sid)
        # log.debug('Connection details:', environ)

@sio.event
async def disconnect(sid):
    with logmap('Client disconnection') as log:
        log.debug('Client disconnected:', sid)

@sio.event
async def generate(sid, data):
    with logmap(f'Generate event for client {sid}') as log:
        try:
            user_prompt = data.get("userPrompt", "")
            model = data.get("model", DEFAULT_MODEL)
            system_prompt = data.get("systemPrompt", DEFAULT_SYSTEM_PROMPT)
            temperature = data.get("temperature", DEFAULT_TEMP)

            if temperature is None or temperature < 0 or temperature > 3:
                temperature = DEFAULT_TEMP
                log.warn(f'Invalid temperature provided. Using default: {DEFAULT_TEMP}')

            query_d = dict(model=model, system_prompt=system_prompt, user_prompt=user_prompt, temperature=temperature)
            log.debug('Query details:', query_d)

            model_output = ''
            with logmap(f'Streaming response from {model}') as stream_log:
                async for response in stream_llm_response(**query_d):
                    model_output += response
                    try:
                        await asyncio.wait_for(sio.emit('response', {'model': model, 'text': response}, room=sid), timeout=5.0)
                    except asyncio.TimeoutError:
                        stream_log.error(f"Emission to client {sid} timed out")
                        break
                    except Exception as e:
                        stream_log.error(f"Error emitting to client {sid}: {str(e)}")
                        break

            log.debug('Emitting response_complete event')
            await sio.emit('response_complete', {'model': model}, room=sid)
        except Exception as e:
            log.error(f"Error in generate event: {str(e)}")
            await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def check_connection(sid):
    with logmap(f'Checking connection for client {sid}') as log:
        try:
            log.debug('Emitting connection_ok event')
            await sio.emit('connection_ok', {'status': 'connected'}, room=sid)
        except Exception as e:
            log.error(f"Error checking connection: {str(e)}")

if __name__ == '__main__':
    with logmap('Starting server') as log:
        log.debug(f'Running app on port 8989')
        web.run_app(app, port=8989)
# app.py
from config import *
from llm_service import stream_llm_response



sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    print('Client connected:', sid)

@sio.event
async def disconnect(sid):
    print('Client disconnected:', sid)

@sio.event
async def generate(sid, data):
    try:
        user_prompt = data.get("userPrompt", "")
        model = data.get("model", DEFAULT_MODEL)
        system_prompt = data.get("systemPrompt", DEFAULT_SYSTEM_PROMPT)
        temperature = data.get("temperature", DEFAULT_TEMP)

        if temperature is None or temperature < 0 or temperature > 3:
            temperature = DEFAULT_TEMP

        query_d = dict(model=model, system_prompt=system_prompt, user_prompt=user_prompt, temperature=temperature)
        print(f'Querying: {query_d}')

        model_output = ''
        async for response in stream_llm_response(**query_d):
            print(response, end='', flush=True)
            model_output += response
            try:
                await asyncio.wait_for(sio.emit('response', {'model': model, 'text': response}, room=sid), timeout=5.0)
            except asyncio.TimeoutError:
                print(f"Emission to client {sid} timed out")
                break
            except Exception as e:
                print(f"Error emitting to client {sid}: {str(e)}")
                break

        await sio.emit('response_complete', {'model': model}, room=sid)
    except Exception as e:
        print(f"Error in generate event for client {sid}: {str(e)}")
        await sio.emit('error', {'message': str(e)}, room=sid)

# Add this new event handler to check client connection
@sio.event
async def check_connection(sid):
    try:
        await sio.emit('connection_ok', {'status': 'connected'}, room=sid)
    except Exception as e:
        print(f"Error checking connection for client {sid}: {str(e)}")

if __name__ == '__main__':
    web.run_app(app, port=8989)

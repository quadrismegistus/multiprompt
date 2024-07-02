# app.py
from config import *

# Initialize the Socket.IO server
sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    logger.debug(f'Client connected: {sid}')

@sio.event
async def disconnect(sid):
    logger.debug(f'Client disconnected: {sid}')

@sio.event
async def generate(sid, data):
    logger.debug(f'Generate event for client {sid}')
    try:
        user_prompt = data.get("userPrompt", "")
        model = data.get("model", DEFAULT_MODEL)
        system_prompt = data.get("systemPrompt", DEFAULT_SYSTEM_PROMPT)
        temperature = data.get("temperature", DEFAULT_TEMP)

        if temperature is None or temperature < 0 or temperature > 3:
            temperature = DEFAULT_TEMP
            logger.warning(f'Invalid temperature provided. Using default: {DEFAULT_TEMP}')

        query_d = dict(model=model, system_prompt=system_prompt, user_prompt=user_prompt, temperature=temperature)
        logger.debug(f'Query details: {query_d}')

        model_output = ''
        with logmap(f'Streaming response from {model}') as stream_log:
            async for response in stream_llm_response(**query_d):
                model_output += response
                try:
                    await sio.emit('response', {'model': model, 'text': response}, to=sid)
                except Exception as e:
                    logger.error(f"Error emitting to client {sid}: {str(e)}")
                    break

        logger.debug('Emitting response_complete event')
        await sio.emit('response_complete', {'model': model}, to=sid)
    except Exception as e:
        logger.error(f"Error in generate event: {str(e)}")
        await sio.emit('error', {'message': str(e)}, to=sid)

@sio.event
async def check_connection(sid):
    logger.debug(f'Checking connection for client {sid}')
    try:
        logger.debug('Emitting connection_ok event')
        await sio.emit('connection_ok', {'status': 'connected'}, room=sid)
    except Exception as e:
        logger.error(f"Error checking connection: {str(e)}")

async def fetch_repo_content(repo_url):
    logger.debug(f'Fetching content from repo URL: {repo_url}')
    reader = GitHubRepoReader(repo_url)
    markdown_content = reader.markdown
    return markdown_content

@sio.event
async def fetchRepoContent(sid, data):
    repo_url = data['url']
    logger.debug(f'Fetch repo content for client {sid}')
    try:
        task = asyncio.create_task(fetch_repo_content(repo_url))
        task.add_done_callback(lambda t: asyncio.create_task(send_repo_content(sid, t)))
        await sio.emit('repoContentStarted', {'message': 'Fetching repo content...'}, room=sid)
    except Exception as e:
        logger.error(f"Error fetching repo content: {str(e)}")
        await sio.emit('repoContentError', {'error': str(e)}, room=sid)

async def send_repo_content(sid, task):
    try:
        markdown_content = task.result()
        await sio.emit('repoContent', {'content': markdown_content}, room=sid)
    except Exception as e:
        logger.error(f"Error sending repo content: {str(e)}")
        await sio.emit('repoContentError', {'error': str(e)}, room=sid)

if __name__ == '__main__':
    logger.debug(f'Running app on port 8989')
    web.run_app(app, port=8989)
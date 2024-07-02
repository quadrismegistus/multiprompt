# app.py
from config import *

sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

# Store active tasks for each client
client_tasks = defaultdict(dict)

@sio.event
async def generate(sid, data):
    logger.debug(f'Generate event for client {sid}')
    try:
        user_prompt = data.get("userPrompt", "")
        model = data.get("model", DEFAULT_MODEL)
        system_prompt = data.get("systemPrompt", DEFAULT_SYSTEM_PROMPT)
        temperature = data.get("temperature", DEFAULT_TEMP)
        agent_id = data.get("agentId")  # New: Get agent ID from client

        if temperature is None or temperature < 0 or temperature > 3:
            temperature = DEFAULT_TEMP
            logger.warning(f'Invalid temperature provided. Using default: {DEFAULT_TEMP}')

        query_d = dict(model=model, system_prompt=system_prompt, user_prompt=user_prompt, temperature=temperature)
        logger.debug(f'Query details: {query_d}')

        # Create a new task for this generate request
        task = asyncio.create_task(stream_response(sid, agent_id, query_d))
        
        # Store the task using both sid and agent_id as keys
        client_tasks[sid][agent_id] = task

        # Wait for the task to complete
        await task

    except Exception as e:
        logger.error(f"Error in generate event: {str(e)}")
        await sio.emit('error', {'message': str(e), 'agentId': agent_id}, to=sid)

async def stream_response(sid, agent_id, query_d):
    model_output = ''
    try:
        async for response in stream_llm_response(**query_d):
            model_output += response
            await sio.emit('response', {'model': query_d['model'], 'text': response, 'agentId': agent_id}, to=sid)
    except Exception as e:
        logger.error(f"Error in stream_response: {str(e)}")
    finally:
        await sio.emit('response_complete', {'model': query_d['model'], 'agentId': agent_id}, to=sid)
        # Remove the completed task
        if sid in client_tasks and agent_id in client_tasks[sid]:
            del client_tasks[sid][agent_id]

@sio.event
async def disconnect(sid):
    logger.debug(f'Client disconnected: {sid}')
    # Cancel all tasks for the disconnected client
    if sid in client_tasks:
        for task in client_tasks[sid].values():
            task.cancel()
        del client_tasks[sid]

@sio.event
async def connect(sid, environ):
    logger.debug(f'Client connected: {sid}')

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


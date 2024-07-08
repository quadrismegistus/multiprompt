from .imports import *
from .utils import *
from .conversations import Conversation
from .repo2llm import GitHubRepoReader

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="aiohttp")
app = web.Application()
sio.attach(app)


@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit("connection_status", {"status": "connected", "log": "Succesfully connected to backend"}, to=sid)


@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def converse(sid, data):
    logger.info(f"Received converse event from client {sid}")
    logger.debug(f"Converse data: {data}")

    user_prompt = data.get("userPrompt", "")
    reference_prompt = data.get("referenceCodePrompt", "")
    agents_data = data.get("agents", [])
    conversation_id = data.get("conversationId")

    conversation = Conversation(id=conversation_id, agents=agents_data)
    conversation_round = conversation.add_round()

    try:
        async for response_d in conversation_round.run_async(
            user_prompt=user_prompt,
            reference_prompt=reference_prompt,
        ):
            logger.debug(f"Emitting response to client {sid}: {response_d}")
            await sio.emit("response", response_d, to=sid)

        logger.info(f"Conversation complete for client {sid}")
        await sio.emit(
            "conversation_complete", {"conversationId": conversation.id, "log":"Conversation complete"}, to=sid
        )

    except Exception as e:
        logger.error(f"Error in converse event: {str(e)}", exc_info=True)
        await sio.emit("error", {"message": str(e)}, to=sid)


async def fetch_repo_content(repo_url):
    logger.debug(f'Fetching content from repo URL: {repo_url}')
    reader = GitHubRepoReader(repo_url)
    markdown_content = reader.markdown
    return markdown_content

@sio.event
async def fetchRepoContent(sid, data):
    repo_url = data['url']
    logger.info(f'Fetch repo content for client {sid}')
    try:
        await sio.emit('repoContentStarted', {'message': 'Fetching repo content...'}, to=sid)
        task = asyncio.create_task(fetch_repo_content(repo_url))
        task.add_done_callback(lambda t: asyncio.create_task(send_repo_content(sid, t)))
    except Exception as e:
        logger.error(f"Error fetching repo content: {str(e)}")
        await sio.emit('repoContentError', {'error': str(e)}, to=sid)


async def send_repo_content(sid, task):
    try:
        markdown_content = task.result()
        await sio.emit('repoContent', {'content': markdown_content}, to=sid)
        await sio.emit('repoContentSuccess', {'content': "Repository successfully imported"}, to=sid)
    except Exception as e:
        logger.error(f"Error sending repo content: {str(e)}")
        await sio.emit('repoContentError', {'error': str(e)}, to=sid)

@sio.event
async def test_connection(sid):
    logger.info(f"Received test_connection event from client {sid}")
    await sio.emit(
        "test_response", {"message": "Server received test connection"}, to=sid
    )


async def main():
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "localhost", 8989)
    await site.start()
    print("Server started at http://localhost:8989")
    await asyncio.Event().wait()  # run forever


if __name__ == "__main__":
    asyncio.run(main())

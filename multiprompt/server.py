from .imports import *
from .utils import *
from .conversations import *
from .repo2llm import *

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="aiohttp")
app = web.Application()
sio.attach(app)


@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit(
        "connection_status",
        {"status": "connected", "log": "Succesfully connected to backend"},
        to=sid,
    )


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
    conversation_round = conversation.add_round(
        user_prompt=user_prompt,
        reference_prompt=reference_prompt,
    )

    try:
        async for response_d in conversation_round.run_async():
            logger.debug(f"Emitting response to client {sid}: {response_d}")
            await sio.emit("response", response_d, to=sid)

        logger.info(f"Conversation complete for client {sid}")
        await sio.emit(
            "conversation_complete",
            {"conversationId": conversation.id, "log": "Conversation complete"},
            to=sid,
        )

    except Exception as e:
        logger.error(f"Error in converse event: {str(e)}", exc_info=True)
        await sio.emit("error", {"message": str(e)}, to=sid)


async def fetch_repo_content(repo_url):
    logger.debug(f"Fetching content from repo URL: {repo_url}")
    reader = GitHubRepoReader(repo_url)
    markdown_content = reader.markdown
    return markdown_content


@sio.event
async def build_reference_prompt_tree(sid, data):
    logger.info(f"build_reference_prompt_tree <- {data}")
    paths = data.get("paths")
    url = data.get("url")
    if paths:
        reader = LocalReader(paths)
    elif url:
        reader = GitHubRepoReader(url)

    output = reader.pathdata
    logger.info(f"returning output {len(output)} paths")
    await sio.emit("new_reference_prompt_tree", {"paths": output}, to=sid)


@sio.event
async def test_connection(sid):
    logger.info(f"Received test_connection event from client {sid}")
    await sio.emit(
        "test_response", {"message": "Server received test connection"}, to=sid
    )


async def main_async():
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "localhost", 8989)
    await site.start()
    print("Server started at http://localhost:8989")
    await asyncio.Event().wait()  # run forever


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
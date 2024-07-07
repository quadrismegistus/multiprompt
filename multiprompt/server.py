from .imports import *
from .utils import *
from .conversations import Conversation

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode='aiohttp')
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit("connection_status", {"status": "connected"}, to=sid)

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
            "conversation_complete", {"conversationId": conversation.id}, to=sid
        )

    except Exception as e:
        logger.error(f"Error in converse event: {str(e)}", exc_info=True)
        await sio.emit("error", {"message": str(e)}, to=sid)

@sio.event
async def test_connection(sid):
    logger.info(f"Received test_connection event from client {sid}")
    await sio.emit("test_response", {"message": "Server received test connection"}, to=sid)

async def main():
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8989)
    await site.start()
    print("Server started at http://localhost:8989")
    await asyncio.Event().wait()  # run forever

if __name__ == '__main__':
    asyncio.run(main())
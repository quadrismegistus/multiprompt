from .imports import *
from .utils import *
from .conversations import Conversation, ConversationRound

sio = socketio.AsyncServer(async_mode="aiohttp", cors_allowed_origins="*")
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    logger.debug(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.debug(f"Client disconnected: {sid}")

@sio.event
async def converse(sid, data):
    logger.debug(f"Start conversation event for client {sid}")
    try:
        user_prompt = data.get("userPrompt", "")
        reference_prompt = data.get("referenceCodePrompt", "")
        agents_data = data.get("agents", [])
        conversation_id = data.get("conversationId")

        conversation = Conversation(id=conversation_id, agents=agents_data)
        conversation_round = conversation.add_round()

        async for response_d in conversation_round.run_async(
            user_prompt=user_prompt,
            reference_prompt=reference_prompt,
        ):
            await sio.emit("response", response_d, to=sid)

        await sio.emit(
            "conversation_complete", {"conversationId": conversation.id}, to=sid
        )

    except Exception as e:
        logger.error(f"Error in converse event: {str(e)}")
        await sio.emit("error", {"message": str(e)}, to=sid)

@sio.event
async def check_connection(sid):
    logger.debug(f"Checking connection for client {sid}")
    try:
        await sio.emit("connection_ok", {"status": "connected"}, room=sid)
    except Exception as e:
        logger.error(f"Error checking connection: {str(e)}")

async def start_server():
    logger.debug(f"Running app on port 8989")
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', 8989)
    await site.start()

def main():
    asyncio.run(start_server())

if __name__ == "__main__":
    main()
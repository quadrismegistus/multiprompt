from .config import *
from .conversation import Agent, Conversation, ConversationRound
from .llm_service import stream_llm_response
from .repo2llm import GitHubRepoReader
import asyncio

sio = socketio.AsyncServer(async_mode='aiohttp', cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

conversations: Dict[str, Conversation] = {}

@sio.event
async def connect(sid, environ):
    logger.debug(f'Client connected: {sid}')

@sio.event
async def disconnect(sid):
    logger.debug(f'Client disconnected: {sid}')

@sio.event
async def start_conversation(sid, data):
    logger.debug(f'Start conversation event for client {sid}')
    try:
        user_prompt = data.get("userPrompt", "")
        reference_prompt = data.get("referenceCodePrompt", "")
        agents_data = data.get("agents", [])

        agents = [Agent.from_dict(agent) for agent in agents_data]

        conversation = Conversation()
        round = ConversationRound(user_prompt, reference_prompt, agents)
        conversation.add_round(round)
        conversations[conversation.id] = conversation

        await handle_conversation(sid, conversation.id)

    except Exception as e:
        logger.error(f"Error in start_conversation event: {str(e)}")
        await sio.emit('error', {'message': str(e)}, to=sid)

async def handle_conversation(sid, conversation_id):
    conversation = conversations[conversation_id]
    current_round = conversation.get_latest_round()

    try:
        combined_prompt = current_round.get_combined_prompt()

        for agent in current_round.agents:
            response = ""
            async for chunk in stream_llm_response(agent, combined_prompt):
                response += chunk
                await sio.emit('response', {
                    'model': agent.model,
                    'text': chunk,
                    'agentId': agent.id
                }, to=sid)

            current_round.add_agent_response(agent.id, response)

            await sio.emit('response_complete', {
                'model': agent.model,
                'agentId': agent.id
            }, to=sid)

        await sio.emit('conversation_complete', {'conversationId': conversation.id}, to=sid)

    except Exception as e:
        logger.error(f"Error in handle_conversation: {str(e)}")
        await sio.emit('error', {'message': str(e)}, to=sid)

@sio.event
async def check_connection(sid):
    logger.debug(f'Checking connection for client {sid}')
    try:
        await sio.emit('connection_ok', {'status': 'connected'}, room=sid)
    except Exception as e:
        logger.error(f"Error checking connection: {str(e)}")

def main():
    logger.debug(f'Running app on port 8989')
    web.run_app(app, port=8989)

if __name__ == '__main__':
    main()
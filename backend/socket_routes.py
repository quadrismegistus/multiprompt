# app/socket_routes.py
from .config import *
from .llm_service import stream_llm_response


class WebSocketHandler:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket

    async def handle_connection(self):
        await self.websocket.accept()
        logger.info("WebSocket connection accepted")
        try:
            while True:
                raw_data = await self.websocket.receive_text()
                logger.info(f"Received data: {raw_data}")
                try:
                    data = json.loads(raw_data)
                    await self.handle_generation_request(data)
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received")
                    await self.send_error("Invalid JSON format")
                except Exception as e:
                    logger.error(f"Error in process_request: {str(e)}")
                    await self.send_error(f"Internal server error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in WebSocket connection: {str(e)}")
        finally:
            await self.websocket.close()

    async def handle_generation_request(self, data:dict):
        user_prompt = data.get("prompt","").strip()
        model = data.get("model",DEFAULT_MODEL).strip()
        system_prompt = data.get("systemPrompt", DEFAULT_SYSTEM_PROMPT)
        temperature = data.get("temperature", DEFAULT_TEMP)
        
        logger.info(f'Streaming normal response from {model}')
        streamer = stream_llm_response(
            model=model,
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=temperature
        )
        
        model_output = ''
        async for response in streamer:
            model_output += response
            await self.send_message({"model": model, "text": response})
        
        await self.send_message({"model": model, "modelResultComplete": True})
        return model_output

    async def send_message(self, message: dict):
        await self.websocket.send_text(json.dumps(message))

    async def send_error(self, error_message: str):
        await self.send_message({"error": error_message})

async def websocket_endpoint(websocket: WebSocket):
    handler = WebSocketHandler(websocket)
    await handler.handle_connection()
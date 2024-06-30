# app/socket_routes.py
from .config import *
from app.services.llm_service import stream_llm_response
from fastapi import WebSocket

logger = logging.getLogger(__name__)

async def websocket_endpoint(websocket: WebSocket):
    """
    Handle WebSocket connections and messages.
    
    Args:
        websocket (WebSocket): The WebSocket connection object.
    """
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    try:
        while True:
            # Receive data from the WebSocket
            raw_data = await websocket.receive_text()
            logger.info(f"Received data: {raw_data}")
            
            try:
                # Parse the received JSON data
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
                continue
            
            # Validate the received data
            if not isinstance(data, dict) or 'prompt' not in data or 'checked_models' not in data:
                logger.error("Invalid data format received")
                await websocket.send_text(json.dumps({"error": "Invalid data format"}))
                continue
            
            try:
                # Process the request
                await handle_request(websocket, data)
            except Exception as e:
                logger.error(f"Error in handle_request: {str(e)}")
                await websocket.send_text(json.dumps({"error": f"Internal server error: {str(e)}"}))
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket connection: {str(e)}")
    finally:
        await websocket.close()
async def handle_request(websocket: WebSocket, data: dict):
    """
    Process the received request data and generate responses from models.
    Args:
        websocket (WebSocket): The WebSocket connection object.
        data (dict): The received request data.
    """
    original_prompt = data['prompt']
    checked_models = data['checked_models']
    include_summary = 'summaryModel' in checked_models
    summary_model = data.get('summary_model', DEFAULT_SUMMARY_MODEL)
    column_configs = data.get('column_configs', {})
    if include_summary:
        checked_models.remove('summaryModel')
    tasks = [handle_normal_model(model, websocket, data, column_configs.get(model, {})) for model in checked_models]
    model_outputs = {}
    results = await asyncio.gather(*tasks)
    for model, result in zip(checked_models, results):
        model_outputs[model] = result
    if include_summary:
        summary_data = {
            'prompt': original_prompt,
            'model_outputs': model_outputs,
            'includeRepoAnalysis': data.get('includeRepoAnalysis', DEFAULT_INCL_REPO)
        }
        await handle_summary_model(summary_model, websocket, summary_data)

async def handle_normal_model(model: str, websocket: WebSocket, data: dict, column_config: dict):
    """
    Handle requests for normal (non-summary) language models.
    Args:
        model (str): The name of the model to use.
        websocket (WebSocket): The WebSocket connection object.
        data (dict): The request data containing the prompt and other parameters.
        column_config (dict): The column configuration containing system prompt and temperature.
    Returns:
        str: The complete model output.
    """
    user_prompt = data["prompt"].strip()
    system_prompt = column_config.get("systemPrompt", DEFAULT_SYSTEM_PROMPT)
    temperature = column_config.get("temperature", DEFAULT_TEMP)
    incl_repo = data.get("includeRepoAnalysis", DEFAULT_INCL_REPO)
    logger.info(f'Streaming normal response from {model}')
    streamer = stream_llm_response(
        model=model,
        user_prompt=user_prompt,
        system_prompt=system_prompt,
        incl_repo=incl_repo,
        temperature=temperature
    )
    model_output = ''
    async for response in streamer:
        model_output += response
        await websocket.send_text(json.dumps({"model": model, "text": response}))
    await websocket.send_text(json.dumps({"model": model, "modelResultComplete": True}))
    return model_output


async def handle_summary_model(model: str, websocket: WebSocket, data: dict):
    """
    Handle requests for the summary model.
    
    Args:
        model (str): The name of the summary model to use.
        websocket (WebSocket): The WebSocket connection object.
        data (dict): The request data containing the original prompt and model outputs.
    """
    original_prompt = data['prompt']
    model_outputs = data['model_outputs']
    incl_repo = data.get("includeRepoAnalysis", DEFAULT_INCL_REPO)
    
    logger.info(f'Streaming summary from {model}')
    
    system_prompt = DEFAULT_SUMMARY_SYSTEM_PROMPT
    responses_sofar = '\n\n-----\n\n'.join(
        f'Model {i+1} ({mdl}):\n{output}'
        for i, (mdl, output) in enumerate(sorted(model_outputs.items()))
    )
    
    example_prompts = [
        (original_prompt, responses_sofar)
    ]
    
    user_prompt = original_prompt + '\n\n' + DEFAULT_SUMMARY_USER_PROMPT
    
    streamer = stream_llm_response(
        model=model,
        system_prompt=system_prompt,
        example_prompts=example_prompts,
        user_prompt=user_prompt.strip(),
        incl_repo=incl_repo
    )
    
    async for response in streamer:
        await websocket.send_text(json.dumps({"model": "summaryModel", "text": response}))
    
    await websocket.send_text(json.dumps({"model": "summaryModel", "modelResultComplete": True}))
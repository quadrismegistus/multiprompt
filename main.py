from app import *
from app.services.llm_service import stream_llm_response

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.get("/models")
async def get_models():
    models_with_nice_names = {v: k for k, v in MODEL_DICT.items()}
    categorized_models = {
        category: [{"value": v, "name": models_with_nice_names[v]} for v in models]
        for category, models in MODEL_CATEGORIES.items()
    }
    return JSONResponse(content={
        "available": categorized_models,
        "default": DEFAULT_MODELS,
        "default_summary_model": DEFAULT_SUMMARY_MODEL
    })

async def handle_normal_model(model, websocket, data):
    user_prompt = data["prompt"]
    system_prompt = DEFAULT_SYSTEM_PROMPT
    incl_repo = data.get("includeRepoAnalysis", DEFAULT_INCL_REPO)
    print(f'Streaming normal from {model}')
    streamer = stream_llm_response(
        model=model,
        user_prompt=user_prompt,
        system_prompt=system_prompt,
        incl_repo=incl_repo
    )
    
    model_output = ''
    async for response in streamer:
        model_output += response
        await websocket.send_text(json.dumps({"model": model, "text": response}))
    
    await websocket.send_text(json.dumps({"model": model, "modelResultComplete": True}))
    return model_output

async def handle_summary_model(model, websocket, data):
    original_prompt = data['prompt']
    model_outputs = data['model_outputs']
    incl_repo = data.get("includeRepoAnalysis", DEFAULT_INCL_REPO)
    
    system_prompt = DEFAULT_SUMMARY_SYSTEM_PROMPT
    responses_sofar = '\n\n-----\n\n'.join(
        f'### RESPONSE FROM LLM {i+1}:\n\n{model_outputs[mdl]}'
        for i, mdl in enumerate(sorted(model_outputs))
    )
    example_prompts = [
        (original_prompt, responses_sofar)
    ]
    user_prompt = DEFAULT_SUMMARY_USER_PROMPT
    user_prompt = original_prompt+'\n\n'+DEFAULT_SUMMARY_USER_PROMPT
    
    print(f'Streaming normal from {model}')
    streamer = stream_llm_response(
        model=model,
        system_prompt=system_prompt,
        example_prompts=example_prompts,
        user_prompt=user_prompt,
        incl_repo=incl_repo
    )
    
    async for response in streamer:
        await websocket.send_text(json.dumps({"model": "summaryModel", "text": response}))
    
    await websocket.send_text(json.dumps({"model": "summaryModel", "modelResultComplete": True}))

async def handle_request(websocket, data={}, **kwargs):
    original_prompt = data['prompt']
    checked_models = data['checked_models']
    include_summary = 'summaryModel' in checked_models
    summary_model = data.get('summary_model', DEFAULT_SUMMARY_MODEL)
    
    if include_summary:
        checked_models.remove('summaryModel')
    
    tasks = []
    model_outputs = {}
    
    for model_item in checked_models:
        task = asyncio.create_task(handle_normal_model(model_item, websocket, data))
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    for model_item, result in zip(checked_models, results):
        model_outputs[model_item] = result
    
    if include_summary:
        summary_data = {
            'prompt': original_prompt,
            'model_outputs': model_outputs,
            'includeRepoAnalysis': data.get('includeRepoAnalysis', DEFAULT_INCL_REPO)
        }
        await handle_summary_model(summary_model, websocket, summary_data)


@app.websocket("/ws/multiprompt")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted")

    try:
        while True:
            raw_data = await websocket.receive_text()
            logger.info(f"Received data: {raw_data}")

            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
                continue

            if not isinstance(data, dict) or 'prompt' not in data or 'checked_models' not in data:
                logger.error("Invalid data format received")
                await websocket.send_text(json.dumps({"error": "Invalid data format"}))
                continue

            try:
                await handle_request(websocket, data)
            except Exception as e:
                logger.error(f"Error in handle_request: {str(e)}")
                await websocket.send_text(json.dumps({"error": f"Internal server error: {str(e)}"}))

    # except WebSocketDisconnect:
        # logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket connection: {str(e)}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
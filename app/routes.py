# routes.py
from .config import *

from fastapi import APIRouter
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter()

@router.get("/")
async def read_root():
    """
    Serve the main HTML file for the application.
    
    Returns:
        FileResponse: The index.html file.
    """
    return FileResponse("static/index.html")

@router.get("/models")
async def get_models():
    """
    Provide information about available models, their categories, and default selections.
    
    Returns:
        JSONResponse: A JSON object containing available models, default models, and the default summary model.
    """
    # Create a dictionary with model values as keys and nice names as values
    models_with_nice_names = {v: k for k, v in MODEL_DICT.items()}
    
    # Categorize models and include their nice names
    categorized_models = {
        category: [{"value": v, "name": models_with_nice_names[v]} for v in models]
        for category, models in MODEL_CATEGORIES.items()
    }
    
    return JSONResponse(content={
        "available": categorized_models,
        "default": DEFAULT_MODELS,
        "default_summary_model": DEFAULT_SUMMARY_MODEL
    })
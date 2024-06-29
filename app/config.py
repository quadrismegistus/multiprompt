import os
import random
from dotenv import load_dotenv
from pprint import pprint,pformat
load_dotenv()

import asyncio
import os
from functools import lru_cache
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold, GenerationConfig
import logging
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
# from fastapi.exceptions import WebSocketDisconnect
import json
import asyncio
import logging





cache = lru_cache(maxsize=None)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

AVAILABLE_MODELS_OPENAI = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo-preview','gpt-4']
AVAILABLE_MODELS_ANTHROPIC = ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
AVAILABLE_MODELS_GEMINI = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']
AVAILABLE_MODELS = AVAILABLE_MODELS_OPENAI + AVAILABLE_MODELS_ANTHROPIC + AVAILABLE_MODELS_GEMINI


MODEL_CATEGORIES = {
    "GPT": [
        "gpt-3.5-turbo",
        "gpt-4o",
        "gpt-4",
        "gpt-4-turbo-preview"
    ],
    "Claude": [
        "claude-3-5-sonnet-20240620",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
    ],
    "Gemini": [
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.0-pro"
    ]
}

MODEL_DICT = {
    "GPT-3.5": "gpt-3.5-turbo",
    "GPT-4o": "gpt-4o",
    "GPT-4": "gpt-4",
    "GPT-4-Turbo": "gpt-4-turbo-preview",
    "Claude-3.5-Sonnet": "claude-3-5-sonnet-20240620",
    "Claude-3-Opus": "claude-3-opus-20240229",
    "Claude-3-Sonnet": "claude-3-sonnet-20240229",
    "Claude-3-Haiku": "claude-3-haiku-20240307",
    "Gemini-1.5-Pro": "gemini-1.5-pro",
    "Gemini-1.5-Flash": "gemini-1.5-flash",
    "Gemini-1.0-Pro": "gemini-1.0-pro"
}

DEFAULT_MODELS = [
    MODEL_DICT["GPT-4o"],
    MODEL_DICT["Claude-3.5-Sonnet"],
    MODEL_DICT["Gemini-1.5-Pro"],
]
DEFAULT_MODEL = DEFAULT_MODELS[0] if len(DEFAULT_MODELS) else None
DEFAULT_OPENAI_MODEL = next((model for model in DEFAULT_MODELS if model in MODEL_CATEGORIES["GPT"]), MODEL_CATEGORIES["GPT"][0])
DEFAULT_ANTHROPIC_MODEL = next((model for model in DEFAULT_MODELS if model in MODEL_CATEGORIES["Claude"]), MODEL_CATEGORIES["Claude"][0])
DEFAULT_GEMINI_MODEL = next((model for model in DEFAULT_MODELS if model in MODEL_CATEGORIES["Gemini"]), MODEL_CATEGORIES["Gemini"][0])
DEFAULT_SUMMARY_MODEL = MODEL_DICT['GPT-4o']
DEFAULT_TEMP = 0.0
DEFAULT_SYSTEM_PROMPT = "With reference to any code or documentation provided, answer the following questions by the user. Show only those lines or functions that were changed, and explain the changes."
DEFAULT_SUMMARY_SYSTEM_PROMPT = "You are a senior developer reviewing parallel solutions provided by junior developers. Synthesize their output into an elegant, modular, clean, documented solution. Then, display in markdown relevant functions, classes and portions of files which your solution alters from the existing repository."
DEFAULT_SUMMARY_USER_PROMPT = "Synthesize and summarize these suggested changes, and return a markdown representation of a directory structure of files necessary to change, along with the full functions or code snippets changed under a markdown heading for the filepath under which they appear."
DEFAULT_INCL_REPO = True

PATH_HOMEDIR = os.path.expanduser('~/.multiprompt')
PATH_DATA = os.path.join(PATH_HOMEDIR,'data')
PATH_LLM_CACHE=os.path.join(PATH_DATA,'cache.multiprompt_llm_cache.sqlitedict')
os.makedirs(PATH_DATA,exist_ok=True)
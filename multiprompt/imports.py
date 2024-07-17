from typing import *
import uuid
import logging
from threading import Thread
import logging
import json
import asyncio
from collections import defaultdict
import threading
import queue
import warnings
import pandas as pd
warnings.filterwarnings('ignore')

import socketio
from aiohttp import web

logging.getLogger("aiohttp.access").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

import os
import random
from dotenv import load_dotenv
from pprint import pprint, pformat

load_dotenv()

import asyncio
import os
from functools import lru_cache
from litellm import acompletion
import logging
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import base64

# from fastapi.exceptions import WebSocketDisconnect
import json
import asyncio
import logging
import hashlib
import sqlitedict
from celery import Celery

import os
import logging
from pathlib import Path
from tqdm import tqdm
from pathspec import PathSpec
from pathspec.patterns import GitWildMatchPattern
import re
import tempfile
import shutil
from git import Repo
from urllib.parse import urlparse
from abc import ABC, abstractmethod
import fnmatch
from functools import cached_property
import argparse

logger = logging.getLogger(__name__)

# List of paths to ignore
IGNORE_PATHS = {
    "setup.py",
    "tests",
    "__init__.py",
    ".github",
    ".gitignore",
    "LICENSE",
    "README.md",
    "requirements.txt",
    "venv",
    'data',
    'notebooks',
    ".vscode",
    ".idea",
    "_version.py",
    # 'package.json',
    ".robots.md",
    "public",
    "*.config.js",
    "*.pyc",
    "*.log",
    "*.tmp",
    "*.temp",
    "*.bak",
    "static",
    ".git",
}


cache = lru_cache(maxsize=None)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


MODEL_CATEGORIES = {
    "GPT": ["gpt-3.5-turbo", "gpt-4o", "gpt-4", "gpt-4-turbo-preview"],
    "Claude": [
        "claude-3-5-sonnet-20240620",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
    ],
    "Gemini": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
    "Local": [
        # "codegemma:2b",
        "ollama/llama3",
        "ollama/codellama",
        "ollama/tinyllama",
    ],
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
    "Gemini-1.0-Pro": "gemini-1.0-pro",
    # "Codegemma:2B":"codegemma:2b",
    "CodeLlama": "codellama",
    "TinyLlama": "tinyllama",
}


DEFAULT_MAX_TOKENS = 4096


DEFAULT_MODELS = [
    MODEL_DICT["GPT-4o"],
    MODEL_DICT["Claude-3.5-Sonnet"],
    MODEL_DICT["Gemini-1.5-Pro"],
]
DEFAULT_MODEL = DEFAULT_MODELS[0] if len(DEFAULT_MODELS) else None
DEFAULT_OPENAI_MODEL = next(
    (model for model in DEFAULT_MODELS if model in MODEL_CATEGORIES["GPT"]),
    MODEL_CATEGORIES["GPT"][0],
)
DEFAULT_ANTHROPIC_MODEL = next(
    (model for model in DEFAULT_MODELS if model in MODEL_CATEGORIES["Claude"]),
    MODEL_CATEGORIES["Claude"][0],
)
DEFAULT_GEMINI_MODEL = next(
    (model for model in DEFAULT_MODELS if model in MODEL_CATEGORIES["Gemini"]),
    MODEL_CATEGORIES["Gemini"][0],
)
DEFAULT_SUMMARY_MODEL = MODEL_DICT["GPT-4o"]
DEFAULT_TEMP = 0.7
DEFAULT_SYSTEM_PROMPT = "With reference to any code or documentation provided, answer the following questions by the user. Show only those lines or functions that were changed, and explain the changes."
DEFAULT_SUMMARY_SYSTEM_PROMPT = "You are a senior developer reviewing parallel solutions provided by junior developers. Synthesize their output into an elegant, modular, clean, documented solution. Then, display in markdown relevant functions, classes and portions of files which your solution alters from the existing repository."
DEFAULT_SUMMARY_USER_PROMPT = "Synthesize and summarize these suggested changes, and return a markdown representation of a directory structure of files necessary to change, along with the full functions or code snippets changed under a markdown heading for the filepath under which they appear."
DEFAULT_INCL_REPO = False

PATH_HOMEDIR = os.path.expanduser("~/.multiprompt")
PATH_DATA = os.path.join(PATH_HOMEDIR, "data")
PATH_LLM_CACHE = os.path.join(PATH_DATA, "cache.multiprompt_llm_cache.sqlitedict")
os.makedirs(PATH_DATA, exist_ok=True)

PATH_REPO = os.path.dirname(os.path.dirname(__file__))
PATH_SRC = os.path.join(PATH_REPO, "src")
PATH_SRC_DATA = os.path.join(PATH_SRC, "data")
PATH_AGENTS_JSON = os.path.join(PATH_SRC_DATA, "agents.json")
PATH_MODELS_JSON = os.path.join(PATH_SRC_DATA, "models.json")

REPO2LLM_EXTENSIONS = [
    ".py",
    ".js",
    ".html",
    ".css",
    ".md",
    ".txt",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".rs",
    ".ipynb",
]
// src/constants.js

class LLMModel {
    constructor(model, name, category) {
        this.model = model;
        this.name = name;
        this.category = category;
    }
}

export const MODEL_LIST = [
    new LLMModel("gpt-3.5-turbo", "GPT-3.5", "GPT"),
    new LLMModel("gpt-4o", "GPT-4o", "GPT"),
    new LLMModel("gpt-4", "GPT-4", "GPT"),
    new LLMModel("gpt-4-turbo-preview", "GPT-4-Turbo", "GPT"),
    new LLMModel("claude-3-5-sonnet-20240620", "Claude 3.5 Sonnet", "Claude"),
    new LLMModel("claude-3-opus-20240229", "Claude 3 Opus", "Claude"),
    new LLMModel("claude-3-sonnet-20240229", "Claude 3 Sonnet", "Claude"),
    new LLMModel("claude-3-haiku-20240307", "Claude 3 Haiku", "Claude"),
    new LLMModel("gemini-1.5-pro", "Gemini 1.5 Pro", "Gemini"),
    new LLMModel("gemini-1.5-flash", "Gemini 1.5 Flash", "Gemini"),
    new LLMModel("gemini-1.0-pro", "Gemini 1.0 Pro", "Gemini"),
    new LLMModel("codellama", "CodeLlama", "Local"),
    new LLMModel("tinyllama", "TinyLlama", "Local"),
];

export const MODEL_CATEGORIES = MODEL_LIST.reduce((acc, model) => {
    if (!acc[model.category]) {
        acc[model.category] = [];
    }
    acc[model.category].push(model.model);
    return acc;
}, {});

export const MODEL_DICT = MODEL_LIST.reduce((acc, model) => {
    acc[model.name] = model.model;
    return acc;
}, {});

export const MODEL_DICT_r = MODEL_LIST.reduce((acc, model) => {
    acc[model.model] = model.name;
    return acc;
}, {});

export const DEFAULT_MODELS = [
    MODEL_DICT["GPT-4o"],
    MODEL_DICT["Claude-3.5-Sonnet"],
    MODEL_DICT["Gemini-1.5-Pro"],
];

export const DEFAULT_MODEL = DEFAULT_MODELS[0] || null;
export const DEFAULT_OPENAI_MODEL = DEFAULT_MODELS.find(model => MODEL_CATEGORIES["GPT"].includes(model)) || MODEL_CATEGORIES["GPT"][0];
export const DEFAULT_ANTHROPIC_MODEL = DEFAULT_MODELS.find(model => MODEL_CATEGORIES["Claude"].includes(model)) || MODEL_CATEGORIES["Claude"][0];
export const DEFAULT_GEMINI_MODEL = DEFAULT_MODELS.find(model => MODEL_CATEGORIES["Gemini"].includes(model)) || MODEL_CATEGORIES["Gemini"][0];
export const DEFAULT_SUMMARY_MODEL = MODEL_DICT['GPT-4o'];
export const DEFAULT_TEMP = 0.0;
export const DEFAULT_SYSTEM_PROMPT = "With reference to any code or documentation provided, answer the following questions by the user. Show only those lines or functions that were changed, and explain the changes.";
export const DEFAULT_SUMMARY_SYSTEM_PROMPT = "You are a senior developer reviewing parallel solutions provided by junior developers. Synthesize their output into an elegant, modular, clean, documented solution. Then, display in markdown relevant functions, classes and portions of files which your solution alters from the existing repository.";
export const DEFAULT_SUMMARY_USER_PROMPT = "Synthesize and summarize these suggested changes, and return a markdown representation of a directory structure of files necessary to change, along with the full functions or code snippets changed under a markdown heading for the filepath under which they appear.";
export const DEFAULT_INCL_REPO = true;

export const ANTHROPIC_BASE_URL = "https://super-custard-978c1f.netlify.app/api/anthropic"
export const SOCKET_SERVER_URL = "http://localhost:8989";
// src/constants.js
import { v4 as uuidv4 } from 'uuid';

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



export const SYSTEM_PROMPT_ANALYST = "With reference to any provided code, analyze the user's query, outline the problem described, and suggest efficient and elegant solutions. Do NOT return the full contents of files; return only lines and functions changed.";
export const SYSTEM_PROMPT_IMPLEMENTER = "With reference to any provided code, implement the suggestions by the previous AI, returning:\n\n* For files minimally changed, return the +/- diff syntax\n* For files substantially changed, return the full revised contents, incorporating the AI output and the original repository contents.";
export const SYSTEM_PROMPT_SECONDDRAFTER = "You are an expert analyst and you have been given a query from a user followed by a first analyst's first attempt at responding to it. You may see code provided by the user as reference to their query, as well as code suggested by the first analyst. Your task is to give a second opinion and examine what the first analyst may have left out or got wrong, and what they definitely got right.";

export const initialAgents = [
  {
    id: "Analyst",
    name: "Analyst",
    type: "ai",
    model: MODEL_DICT["GPT-4o"],
    systemPrompt: SYSTEM_PROMPT_ANALYST,
    output: "",
    temperature: 0.7,
    position: 1,
    progress: 0
  },
  {
    id: "Second Passer",
    name: "Second Passer",
    type: "ai",
    model: "claude-3-5-sonnet-20240620",
    systemPrompt: SYSTEM_PROMPT_SECONDDRAFTER,
    output: "",
    temperature: 0.7,
    position: 2,
    progress: 0
  },
  {
    id: "Implementer",
    name: "Implementer",
    type: "ai",
    model: MODEL_DICT["GPT-3.5"],
    systemPrompt: SYSTEM_PROMPT_IMPLEMENTER,
    output: "",
    temperature: 0.7,
    position: 3,
    progress: 0
  },
];

export const initialAgentTypes = initialAgents.reduce((acc, agent) => {
  acc[agent.name] = {
    name: agent.name,
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature
  };
  return acc;
}, {});

export const MAX_CONVO_HISTORY_MSG_LEN = 50; // Example value, set this to your required length

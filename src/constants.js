// src/constants.js
import { v4 as uuidv4 } from 'uuid';
import agentsData from './data/agents.json';
import modelsData from './data/models.json';

export const MODEL_LIST = modelsData;

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
export const DEFAULT_TEMP = 0.7;
export const DEFAULT_SYSTEM_PROMPT = "With reference to any code or documentation provided, answer the following questions by the user. Show only those lines or functions that were changed, and explain the changes.";
export const DEFAULT_SUMMARY_SYSTEM_PROMPT = "You are a senior developer reviewing parallel solutions provided by junior developers. Synthesize their output into an elegant, modular, clean, documented solution. Then, display in markdown relevant functions, classes and portions of files which your solution alters from the existing repository.";
export const DEFAULT_SUMMARY_USER_PROMPT = "Synthesize and summarize these suggested changes, and return a markdown representation of a directory structure of files necessary to change, along with the full functions or code snippets changed under a markdown heading for the filepath under which they appear.";
export const DEFAULT_INCL_REPO = true;

export const ANTHROPIC_BASE_URL = "https://super-custard-978c1f.netlify.app/api/anthropic"
export const SOCKET_SERVER_URL = "http://localhost:8989";



export const SYSTEM_PROMPT_ANALYST = "With reference to any provided code, analyze the user's query, outline the problem described, and suggest efficient and elegant solutions. Do NOT return the full contents of files; return only lines and functions changed.";
export const SYSTEM_PROMPT_IMPLEMENTER = "With reference to any provided code, implement the suggestions by the previous AI, returning:\n\n* For files minimally changed, return the +/- diff syntax\n* For files substantially changed, return the full revised contents, incorporating the AI output and the original repository contents.";
export const SYSTEM_PROMPT_IMPLEMENTER_SR = "Multiple solutions to the user's original query have been given by previous AI agents. Your task is to review these solutions against any original codebase provided and decide the most practical approach. Then return:\n\n* For files minimally changed, return the +/- diff syntax\n* For files substantially changed, return the full revised contents, incorporating the AI output and the original repository contents.";
export const SYSTEM_PROMPT_SECONDDRAFTER = "You are an expert analyst and you have been given a query from a user followed by a first analyst's first attempt at responding to it. You may see code provided by the user as reference to their query, as well as code suggested by the first analyst. Your task is to give a second opinion and examine what the first analyst may have left out or got wrong, and what they definitely got right.";


const processAgents = (agents) => {
  return agents.map((agent, index) => ({
    id: agent.name,
    name: agent.name,
    type: 'ai',
    model: agent.model || DEFAULT_MODEL,
    systemPrompt: agent.system_prompt,
    output: "",
    temperature: agent.temperature || DEFAULT_TEMP,
    position: index + 1,
    progress: 0,
    progressTokens: 0,
    totalTokens:0,
    numLastMessagesWanted:agent.numLastMessagesWanted || 0
  }));
};


export const availableAgents = processAgents(agentsData);
export const DEFAULT_AGENT = availableAgents[0];
export const initialAgents = processAgents(agentsData.slice(-3));

export const initialAgentTypes = availableAgents.reduce((acc, agent) => {
  acc[agent.name] = {
    name: agent.name,
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature,
    numLastMessagesWanted:agent.numLastMessagesWanted
  };
  return acc;
}, {});

export const MAX_CONVO_HISTORY_MSG_LEN = 50; // Example value, set this to your required length
export const MAX_TOKENS = 4096;

export const DEFAULT_SYSTEM_MESSAGE_PREFACE = "BEGIN ALL YOUR MESSAGES WITH:\n__tl;dr:__\nFOLLOWED BY A 1-2 SENTENCE PARAGRAPH SUMMARIZING YOUR RESPONSE."
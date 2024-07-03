import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_MODEL, MODEL_DICT } from '../constants';

const SYSTEM_PROMPT_ANALYST = "With reference to any provided code, analyze the user's query, outline the problem described, and suggest efficient and elegant solutions. Do NOT return the full contents of files; return only lines and functions changed.";
const SYSTEM_PROMPT_IMPLEMENTER = "With reference to any provided code, implement the suggestions by the previous AI, returning:\n\n* For files minimally changed, return the +/- diff syntax\n* For files substantially changed, return the full revised contents, incorporating the AI output and the original repository contents.";

const initialAgents = [
  {
    id: uuidv4(),
    name: "Analyst",
    type: "ai",
    model: "claude-3-5-sonnet-20240620",
    systemPrompt: SYSTEM_PROMPT_ANALYST,
    output: "",
    temperature: 0.7,
    position: 1,
    progress: 0
  },
  {
    id: uuidv4(),
    name: "Implementer",
    type: "ai",
    model: MODEL_DICT["GPT-4o"],
    systemPrompt: SYSTEM_PROMPT_IMPLEMENTER,
    output: "",
    temperature: 0.7,
    position: 2,
    progress: 0
  }
];

const initialConfig = {
  includeRepoAnalysis: true,
  summaryModel: false,
  summaryModelValue: '',
  openaiApiKey: '',
  claudeApiKey: '',
  referenceCodePrompt: '',
  userPrompt: '',
  isDarkMode: false,
  savedGlobalConfigurations: {},
  conversationHistory: [],
  useFileInput: false,
  githubUrl: '',
  activeModal: null,
};

const normalizePositions = (agents) => {
  const sortedAgents = [...agents].sort((a, b) => a.position - b.position);
  return sortedAgents.map((agent, index) => ({ ...agent, position: index + 1 }));
};

const useStore = create(
  persist(
    (set, get) => ({
    agents: initialAgents,
    config: initialConfig,
    savedAgentConfigurations: {
      "Analyst": {
        name: "Analyst",
        model: MODEL_DICT["GPT-4o"],
        systemPrompt: SYSTEM_PROMPT_ANALYST,
        temperature: 0.7
      },
      "Implementer": {
        name: "Implementer",
        model: MODEL_DICT["GPT-4o"],
        systemPrompt: SYSTEM_PROMPT_IMPLEMENTER,
        temperature: 0.5
      }
    },

    updateUserPrompt: (prompt) => set(state => ({
      config: { ...state.config, userPrompt: prompt }
    })),

    updateAgent: (id, updates) => set((state) => ({
      agents: normalizePositions(state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ))
    })),

    addAgent: (clickedAgentPosition) => set((state) => {
      const newAgent = {
        id: uuidv4(),
        name: `Agent ${state.agents.length + 1}`,
        type: 'ai',
        model: DEFAULT_MODEL,
        position: clickedAgentPosition + 1,
        systemPrompt: '',
        output: '',
        temperature: 0.7,
        progress: 0
      };
      return {
        agents: normalizePositions([...state.agents, newAgent])
      };
    }),

    removeAgent: (id) => set((state) => ({
      agents: normalizePositions(state.agents.filter((agent) => agent.id !== id))
    })),

    moveAgentTo: (id, newPosition) => set((state) => ({
      agents: normalizePositions(state.agents.map((agent) =>
        agent.id === id ? { ...agent, position: newPosition } : agent
      ))
    })),

    updateConfig: (newConfig) => set((state) => ({
      config: { ...state.config, ...newConfig }
    })),

    clearAgentCache: () => set(() => ({
      agents: initialAgents,
      config: initialConfig
    })),

    saveAgentConfiguration: (name, configuration) => set((state) => ({
      savedAgentConfigurations: {
        ...state.savedAgentConfigurations,
        [name]: configuration
      }
    })),

    loadAgentConfiguration: (agentId, name) => set((state) => ({
      agents: normalizePositions(state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, ...state.savedAgentConfigurations[name] } : agent
      ))
    })),

    addConversationHistory: (conversation) => set((state) => ({
      config: {
        ...state.config,
        conversationHistory: [...state.config.conversationHistory, conversation]
      }
    })),

    showModal: (modalType) => set((state) => ({
      config: { ...state.config, activeModal: modalType }
    })),

    hideModal: () => set((state) => ({
      config: { ...state.config, activeModal: null }
    })),

    toggleTheme: () => set((state) => ({
      config: { ...state.config, isDarkMode: !state.config.isDarkMode }
    })),
  }),
  {
    name:'multiprompt-state',
    storage: createJSONStorage(() => localStorage)
  }
)
);

export default useStore;
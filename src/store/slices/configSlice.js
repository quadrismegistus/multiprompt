import { DEFAULT_SYSTEM_MESSAGE_PREFACE } from "../../constants";

export const createConfigSlice = (set) => ({
  config: {
    openaiApiKey: "",
    claudeApiKey: "",
    savedGlobalConfigurations: {},
    conversationHistory: [],
    githubUrl: "",
    systemMessagePreface: DEFAULT_SYSTEM_MESSAGE_PREFACE,
  },

  updateConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates },
  })),

  addConversationHistory: (conversation) => set((state) => ({
    config: {
      ...state.config,
      conversationHistory: [
        ...state.config.conversationHistory,
        conversation,
      ],
    },
  })),
});
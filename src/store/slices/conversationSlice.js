export const createConversationSlice = (set, get) => ({
  currentConversation: [],
  userPrompt: "",
  referenceCodePrompt: "",

  addUserMessageToCurrentConversation: (userPrompt) => set((state) => ({
    currentConversation: [
      ...state.currentConversation,
      { content: userPrompt, isUser: true, sender: "User" },
    ],
  })),

  addAgentResponse: (agentId, response) => set((state) => {
    const agent = get().agents.find((agent) => agent.id === agentId);
    return {
      currentConversation: [
        ...state.currentConversation,
        {
          content: response,
          isUser: false,
          sender: agent.name,
          agentId: agent.id,
          agentName: agent.name,
          agentModel: agent.model,
          agentPosition: agent.position,
          agentSystemPrompt: agent.systemPrompt,
          agentTemperature: agent.temperature,
        },
      ],
    };
  }),

  updateUserPrompt: (prompt) => set({ userPrompt: prompt }),
  updateReferenceCodePrompt: (prompt) => set({ referenceCodePrompt: prompt }),

  getCurrentConversation: () => {
    const state = get();
    return state.conversations.find(
      (c) => c.id === state.currentConversationId
    );
  },
});
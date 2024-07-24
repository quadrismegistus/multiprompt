import { normalizePositions } from "../../utils/agentUtils";
import { getCostPerToken } from "../../utils/promptUtils";
import { DEFAULT_AGENT, initialAgents } from "../../constants";

export const createAgentSlice = (set, get) => ({
  agents: initialAgents,
  totalCost: 0,
  totalTokens: 0,
  totalTokensByAgent: {},

  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map((agent) =>
      agent.id === id ? { ...agent, ...updates } : agent
    ),
  })),

  resetAgentProgress: (id) => set((state) => ({
    agents: state.agents.map((agent) =>
      agent.id === id
        ? { ...agent, progress: 0, progressTokens: 0, output: "" }
        : agent
    ),
  })),

  addAgent: (clickedAgentPosition) => set((state) => ({
    agents: normalizePositions([
      ...state.agents,
      { ...DEFAULT_AGENT, position: clickedAgentPosition + 1 },
    ]),
  })),

  addAgentToken: (agentId, token) => set((state) => {
    const agent = state.agents.find((agent) => agent.id === agentId);
    if (!agent) return state;

    const updatedAgent = {
      ...agent,
      output: agent.output + token,
      totalTokens: agent.totalTokens + 1,
      progressTokens: agent.progressTokens + 1,
    };

    const costPerToken = getCostPerToken(agent.model);
    const newTotalCost = state.totalCost + costPerToken;
    const newTotalTokens = state.totalTokens + 1;
    const newTotalTokensByAgent = {
      ...state.totalTokensByAgent,
      [agentId]: (state.totalTokensByAgent[agentId] || 0) + 1,
    };

    return {
      agents: state.agents.map((a) => (a.id === agentId ? updatedAgent : a)),
      totalCost: newTotalCost,
      totalTokens: newTotalTokens,
      totalTokensByAgent: newTotalTokensByAgent,
    };
  }),

  removeAgent: (id) => set((state) => ({
    agents: normalizePositions(state.agents.filter((agent) => agent.id !== id)),
  })),

  moveAgentTo: (id, newPosition) => set((state) => {
    if (newPosition <= 0) return state;

    const agents = state.agents.map((agent) =>
      agent.id === id ? { ...agent, position: newPosition } : agent
    );

    return { agents: normalizePositions(agents) };
  }),

  getAgentById: (agentId) => get().agents.find((a) => a.id === agentId),

  clearAgentCache: () => set(() => ({
    agents: initialAgents,
  })),
});
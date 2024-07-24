import { initialAgents } from "../../constants";
import { normalizePositions } from "../../utils/agentUtils";

export const createWorkflowSlice = (set) => ({
  savedWorkflows: {},
  savedAgentConfigurations: {},

  saveWorkflow: (name, workflow) => set((state) => ({
    savedWorkflows: {
      ...state.savedWorkflows,
      [name]: workflow
    }
  })),

  loadWorkflow: (workflow) => set(() => {
    const newAgents = workflow.agents
      .map(agentData => {
        const existingAgent = initialAgents.find(agent => agent.id === agentData.id);
        return existingAgent ? { ...existingAgent, position: agentData.position } : null;
      })
      .filter(agent => agent !== null);
    
    return { agents: normalizePositions(newAgents) };
  }),

  saveAgentConfiguration: (name, configuration) => set((state) => ({
    savedAgentConfigurations: {
      ...state.savedAgentConfigurations,
      [name]: configuration,
    },
  })),

  loadAgentConfiguration: (agentId, name) => set((state) => ({
    agents: normalizePositions(
      state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, ...state.savedAgentConfigurations[name] }
          : agent
      )
    ),
  })),
});
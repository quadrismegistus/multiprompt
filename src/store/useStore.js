import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  DEFAULT_MODEL,
  DEFAULT_AGENT,
  DEFAULT_SYSTEM_MESSAGE_PREFACE,
  initialAgentTypes,
  initialAgents,
  MAX_TOKENS,
} from "../constants";
import { normalizePositions } from "../utils/agentUtils";
import { getCostPerToken } from "../utils/promptUtils";

const useStore = create(
  persist(
    (set, get) => ({
      // Frequently updated items at top level
      agents: initialAgents,
      userPrompt: "",
      referenceCodePrompt: "",
      activeModal: null,
      isDarkMode: false,
      totalCost: 0, // Add totalCost to the state
      totalTokens: 0,
      totalTokensByAgent: {},

      // Less frequently updated items in config
      config: {
        openaiApiKey: "",
        claudeApiKey: "",
        savedGlobalConfigurations: {},
        conversationHistory: [],
        githubUrl: "",
        systemMessagePreface: DEFAULT_SYSTEM_MESSAGE_PREFACE,
      },

      savedAgentConfigurations: initialAgentTypes,

      currentConversation: [], // List to store all messages in the current conversation

      addUserMessage: (userPrompt) =>
        set((state) => ({
          currentConversation: [
            ...state.currentConversation,
            { content: userPrompt, isUser: true, sender: "User" },
          ],
        })),

      addAgentResponse: (agentId, response) =>
        set((state) => {
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

      // Update functions for top-level items
      updateUserPrompt: (prompt) => {
        console.log("updateUserPrompt", prompt);
        set({ userPrompt: prompt });
      },
      updateReferenceCodePrompt: (prompt) => {
        console.log("updateReferenceCodePrompt", prompt);
        set({ referenceCodePrompt: prompt });
      },
      setActiveModal: (modalType) => {
        console.log("setActiveModal", modalType);
        set({ activeModal: modalType });
      },
      toggleTheme: () => {
        console.log("toggleTheme");
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },

      // // Update functions for agents
      // updateAgent: (id, updates) => {
      //   // console.log("updateAgent", id, updates);
      //   set((state) => ({
      //     agents: normalizePositions(state.agents.map((agent) =>
      //       agent.id === id ? { ...agent, ...updates } : agent
      //     ))
      //   }));
      // },


      updateAgent: (id, updates) => {
        set((state) => {
          const agents = state.agents.map((agent) => {
            if (agent.id === id) {
              const updatedAgent = { ...agent, ...updates };
              return updatedAgent;
            }
            return agent;
          });
          return { agents };
        });
      },

      resetAgentProgress: (id) => {
        set((state) => {
          const agents = state.agents.map((agent) => {
            if (agent.id === id) {
              return { ...agent, progress: 0, progressTokens: 0, output: "" };
            }
            return agent;
          });
          return { agents };
        });
      },

      addAgent: (clickedAgentPosition) => {
        console.log("addAgent", clickedAgentPosition);
        set((state) => {
          return {
            agents: normalizePositions([...state.agents, DEFAULT_AGENT]),
          };
        });
      },

      addAgentToken: (agentId, token) => {
        set((state) => {
            const agent = state.agents.find((agent) => agent.id === agentId);
            if (!agent) return state;
    
            // Update agent's attributes
            agent.output += token;
            agent.totalTokens += 1;
            agent.progressTokens += 1;
    
            // Update state totals
            state.totalTokens += 1;
            if (agent.id in state.totalTokensByAgent) {
                state.totalTokensByAgent[agent.id] += 1;
            } else {
                state.totalTokensByAgent[agent.id] = 1;
            }
    
            // Calculate cost per token
            const costPerToken = getCostPerToken(agent.model);
            state.totalCost += costPerToken;
    
            // Update total cost by agent
            if (agent.id in state.totalCostByAgent) {
                state.totalCostByAgent[agent.id] += costPerToken;
            } else {
                state.totalCostByAgent[agent.id] = costPerToken;
            }
    
            // Return updated state
            return {
                agents: state.agents.map((a) =>
                    a.id === agentId ? { ...a, output: agent.output, totalTokens: agent.totalTokens, progressTokens: agent.progressTokens } : a
                ),
                totalCost: state.totalCost,
                totalTokens: state.totalTokens,
                totalTokensByAgent: { ...state.totalTokensByAgent },
                totalCostByAgent: { ...state.totalCostByAgent }
            };
        });
    },    

      removeAgent: (id) => {
        console.log("removeAgent", id);
        set((state) => ({
          agents: normalizePositions(
            state.agents.filter((agent) => agent.id !== id)
          ),
        }));
      },

      moveAgentTo: (id, newPosition) => {
        console.log("moveAgentTo called", id, newPosition);
        if (newPosition > 0) {
          set((state) => {
            const agents = [...state.agents];
            const agentIndex = agents.findIndex((agent) => agent.id === id);
            if (agentIndex === -1) {
              console.log("Agent not found", id);
              return state;
            }

            const agent = { ...agents[agentIndex], position: newPosition };
            agents[agentIndex] = agent;
            console.log("Agent position updated", agent);

            const normalizedAgents = normalizePositions(agents);
            console.log("Agents after normalization", normalizedAgents);

            return {
              ...state,
              agents: normalizedAgents,
            };
          });
        } else {
          console.log("Invalid newPosition", newPosition);
          return get(); // return the current state if the position is not valid
        }
      },

      // moveAgentTo: (id, newPosition) => {
      //   console.log("moveAgentTo", id, newPosition);
      //   set((state) => {
      //     const originalPosition = state.agents.find(a => a.id === id).position;
      //     console.log("originalPosition", originalPosition);

      //     const updatedAgents = state.agents.map(agent => {
      //       if (agent.id === id) {
      //         console.log("Updating agent position", agent.id, "from", agent.position, "to", newPosition);
      //         return { ...agent, position: newPosition };
      //       } else if (agent.position >= newPosition && agent.position < originalPosition) {
      //         console.log("Incrementing agent position", agent.id, "from", agent.position, "to", agent.position + 1);
      //         return { ...agent, position: agent.position + 1 };
      //       } else if (agent.position <= newPosition && agent.position > originalPosition) {
      //         console.log("Decrementing agent position", agent.id, "from", agent.position, "to", agent.position - 1);
      //         return { ...agent, position: agent.position - 1 };
      //       }
      //       return agent;
      //     });

      //     console.log("Updated agents", updatedAgents);
      //     const normalizedAgents = normalizePositions(updatedAgents);
      //     console.log("Normalized agents", normalizedAgents);

      //     return { agents: normalizedAgents };
      //   });
      // },

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find(
          (c) => c.id === state.currentConversationId
        );
      },

      getAgentById: (agentId) => {
        const state = get();
        console.log("agents now", state.agents);
        return state.agents.find((a) => a.id === agentId);
      },

      // Update function for config object
      updateConfig: (updates) => {
        console.log("updateConfig", updates);
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },

      // Other functions
      clearAgentCache: () => {
        console.log("clearAgentCache");
        set((state) => ({
          agents: initialAgents,
          currentConversation: [],
        }));
      },

      saveAgentConfiguration: (name, configuration) => {
        console.log("saveAgentConfiguration", name, configuration);
        set((state) => ({
          savedAgentConfigurations: {
            ...state.savedAgentConfigurations,
            [name]: configuration,
          },
        }));
      },

      loadAgentConfiguration: (agentId, name) => {
        console.log("loadAgentConfiguration", agentId, name);
        set((state) => ({
          agents: normalizePositions(
            state.agents.map((agent) =>
              agent.id === agentId
                ? { ...agent, ...state.savedAgentConfigurations[name] }
                : agent
            )
          ),
        }));
      },

      addConversationHistory: (conversation) => {
        console.log("addConversationHistory", conversation);
        set((state) => ({
          config: {
            ...state.config,
            conversationHistory: [
              ...state.config.conversationHistory,
              conversation,
            ],
          },
        }));
      },

      showModal: (modalType) => {
        console.log("showModal", modalType);
        set({ activeModal: modalType });
      },
      hideModal: () => {
        console.log("hideModal");
        set({ activeModal: null });
      },
    }),
    {
      name: "multiprompt-state",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useStore;
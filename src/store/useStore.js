import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createAgentSlice } from "./slices/agentSlice";
import { createConfigSlice } from "./slices/configSlice";
import { createConversationSlice } from "./slices/conversationSlice";
import { createUISlice } from "./slices/uiSlice";
import { createWorkflowSlice } from "./slices/workflowSlice";
import { createReferenceSlice } from "./slices/referenceSlice";

const useStore = create(
  persist(
    (...a) => ({
      ...createAgentSlice(...a),
      ...createConfigSlice(...a),
      ...createConversationSlice(...a),
      ...createUISlice(...a),
      ...createWorkflowSlice(...a),
      ...createReferenceSlice(...a),
    }),
    {
      name: "multiprompt-state",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useStore;

// import { create } from "zustand";
// import { persist, createJSONStorage } from "zustand/middleware";
// import {
//   DEFAULT_AGENT,
//   DEFAULT_SYSTEM_MESSAGE_PREFACE,
//   initialAgentTypes,
//   initialAgents,
// } from "../constants";
// import { normalizePositions } from "../utils/agentUtils";
// import { getCostPerToken } from "../utils/promptUtils";

// const useStore = create(
//   persist(
//     (set, get) => ({
//       agents: initialAgents,
//       userPrompt: "",
//       referenceCodePrompt: "",
//       activeModal: null,
//       isDarkMode: false,
//       totalCost: 0,
//       totalTokens: 0,
//       totalTokensByAgent: {},
//       selectedReferencePaths: [],
//       rootReferencePath: "",

//       config: {
//         openaiApiKey: "",
//         claudeApiKey: "",
//         savedGlobalConfigurations: {},
//         conversationHistory: [],
//         githubUrl: "",
//         systemMessagePreface: DEFAULT_SYSTEM_MESSAGE_PREFACE,
//       },

//       savedAgentConfigurations: initialAgentTypes,

//       currentConversation: [],

//       addUserMessageToCurrentConversation: (userPrompt) =>
//         set((state) => ({
//           currentConversation: [
//             ...state.currentConversation,
//             { content: userPrompt, isUser: true, sender: "User" },
//           ],
//         })),

//       addAgentResponse: (agentId, response) =>
//         set((state) => {
//           const agent = get().agents.find((agent) => agent.id === agentId);
//           return {
//             currentConversation: [
//               ...state.currentConversation,
//               {
//                 content: response,
//                 isUser: false,
//                 sender: agent.name,
//                 agentId: agent.id,
//                 agentName: agent.name,
//                 agentModel: agent.model,
//                 agentPosition: agent.position,
//                 agentSystemPrompt: agent.systemPrompt,
//                 agentTemperature: agent.temperature,
//               },
//             ],
//           };
//         }),

//       updateUserPrompt: (prompt) => {
//         console.log("updateUserPrompt", prompt);
//         set({ userPrompt: prompt });
//       },
//       updateReferenceCodePrompt: (prompt) => {
//         console.log("updateReferenceCodePrompt", prompt);
//         set({ referenceCodePrompt: prompt });
//       },
//       setActiveModal: (modalType) => {
//         console.log("setActiveModal", modalType);
//         set({ activeModal: modalType });
//       },
//       toggleTheme: () => {
//         console.log("toggleTheme");
//         set((state) => ({ isDarkMode: !state.isDarkMode }));
//       },

//       updateAgent: (id, updates) => {
//         set((state) => {
//           const agents = state.agents.map((agent) => {
//             if (agent.id === id) {
//               const updatedAgent = { ...agent, ...updates };
//               return updatedAgent;
//             }
//             return agent;
//           });
//           return { agents };
//         });
//       },

//       resetAgentProgress: (id) => {
//         set((state) => {
//           const agents = state.agents.map((agent) => {
//             if (agent.id === id) {
//               return { ...agent, progress: 0, progressTokens: 0, output: "" };
//             }
//             return agent;
//           });
//           return { agents };
//         });
//       },

//       addAgent: (clickedAgentPosition) => {
//         console.log("addAgent", clickedAgentPosition);
//         set((state) => {
//           return {
//             agents: normalizePositions([
//               ...state.agents,
//               { ...DEFAULT_AGENT, position: clickedAgentPosition + 1 },
//             ]),
//           };
//         });
//       },

//       addAgentToken: (agentId, token) => {
//         set((state) => {
//           const agent = state.agents.find((agent) => agent.id === agentId);
//           if (!agent) return state;

//           agent.output += token;
//           agent.totalTokens += 1;
//           agent.progressTokens += 1;

//           state.totalTokens += 1;
//           if (agent.id in state.totalTokensByAgent) {
//             state.totalTokensByAgent[agent.id] += 1;
//           } else {
//             state.totalTokensByAgent[agent.id] = 1;
//           }

//           const costPerToken = getCostPerToken(agent.model);
//           state.totalCost += costPerToken;

//           return {
//             agents: state.agents.map((a) =>
//               a.id === agentId
//                 ? {
//                     ...a,
//                     output: agent.output,
//                     totalTokens: agent.totalTokens,
//                     progressTokens: agent.progressTokens,
//                   }
//                 : a
//             ),
//             totalCost: state.totalCost,
//             totalTokens: state.totalTokens,
//             totalTokensByAgent: { ...state.totalTokensByAgent },
//           };
//         });
//       },

//       removeAgent: (id) => {
//         console.log("removeAgent", id);
//         set((state) => ({
//           agents: normalizePositions(
//             state.agents.filter((agent) => agent.id !== id)
//           ),
//         }));
//       },

//       moveAgentTo: (id, newPosition) => {
//         console.log("moveAgentTo called", id, newPosition);
//         if (newPosition > 0) {
//           set((state) => {
//             const agents = [...state.agents];
//             const agentIndex = agents.findIndex((agent) => agent.id === id);
//             if (agentIndex === -1) {
//               console.log("Agent not found", id);
//               return state;
//             }

//             const agent = { ...agents[agentIndex], position: newPosition };
//             agents[agentIndex] = agent;
//             console.log("Agent position updated", agent);

//             const normalizedAgents = normalizePositions(agents);
//             console.log("Agents after normalization", normalizedAgents);

//             return {
//               ...state,
//               agents: normalizedAgents,
//             };
//           });
//         } else {
//           console.log("Invalid newPosition", newPosition);
//           return get();
//         }
//       },

//       getCurrentConversation: () => {
//         const state = get();
//         return state.conversations.find(
//           (c) => c.id === state.currentConversationId
//         );
//       },

//       getAgentById: (agentId) => {
//         const state = get();
//         console.log("agents now", state.agents);
//         return state.agents.find((a) => a.id === agentId);
//       },

//       updateConfig: (updates) => {
//         console.log("updateConfig", updates);
//         set((state) => ({
//           config: { ...state.config, ...updates },
//         }));
//       },

//       clearAgentCache: () => {
//         console.log("clearAgentCache");
//         set((state) => ({
//           agents: initialAgents,
//           currentConversation: [],
//         }));
//       },

//       saveAgentConfiguration: (name, configuration) => {
//         console.log("saveAgentConfiguration", name, configuration);
//         set((state) => ({
//           savedAgentConfigurations: {
//             ...state.savedAgentConfigurations,
//             [name]: configuration,
//           },
//         }));
//       },

//       loadAgentConfiguration: (agentId, name) => {
//         console.log("loadAgentConfiguration", agentId, name);
//         set((state) => ({
//           agents: normalizePositions(
//             state.agents.map((agent) =>
//               agent.id === agentId
//                 ? { ...agent, ...state.savedAgentConfigurations[name] }
//                 : agent
//             )
//           ),
//         }));
//       },

//       addConversationHistory: (conversation) => {
//         console.log("addConversationHistory", conversation);
//         set((state) => ({
//           config: {
//             ...state.config,
//             conversationHistory: [
//               ...state.config.conversationHistory,
//               conversation,
//             ],
//           },
//         }));
//       },

//       showModal: (modalType) => {
//         console.log("showModal", modalType);
//         set({ activeModal: modalType });
//       },
//       hideModal: () => {
//         console.log("hideModal");
//         set({ activeModal: null });
//       },

//       savedWorkflows: {},

//       saveWorkflow: (name, workflow) => {
//         console.log('saveWorkflow',name,workflow);
//         set(state => ({
//           savedWorkflows: {
//             ...state.savedWorkflows,
//             [name]: workflow
//           }
//         }));
//       },

//       loadWorkflow: (workflow) => {
//         console.log('loadWorkflow',workflow);
//         // const state = get();
//         const newAgents = workflow.agents.map(agentData => {
//           const existingAgent = initialAgents.find(agent => agent.id === agentData.id);
//           if (existingAgent) {
//             return { ...existingAgent, position: agentData.position };
//           }
//           return null;
//         }).filter(agent => agent !== null);
        
//         console.log('newAgents',newAgents);
//         set({
//           agents: normalizePositions(newAgents),
//         });
//       },


//       setRootReferencePath: (path) => {
//         set({rootReferencePath: path});
//       },

//       setSelectedReferencePaths: (paths) => {
//         console.log("setSelectedReferencePaths", paths);
//         set({ selectedReferencePaths: paths });
//       },

//     }),
//     {
//       name: "multiprompt-state",
//       storage: createJSONStorage(() => localStorage),
//     }
//   )
// );

// export default useStore;

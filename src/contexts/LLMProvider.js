// src/contexts/LLMProvider.js

import React, { createContext, useContext, useState, useCallback } from "react";
import { getUserPromptWithReferencePrompt } from "../utils/promptUtils";
import { useSocket } from "./SocketContext";
import useStore from "../store/useStore";

console.log("Initializing LLMContext");

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [agentProgress, setAgentProgress] = useState({});

  const { config, agents, updateAgent, addAgentToken } = useStore();

  const handleSendPrompt = useCallback(
    async (userPrompt, referenceCodePrompt, targetAgentId = null) => {
      if (!isConnected || !socket) {
        console.error("Socket is not connected");
        return;
      }

      const { addUserMessageToCurrentConversation, currentConversation, resetAgentProgress, selectedReferencePaths, rootReferencePath } =
        useStore.getState();

      let combinedUserPrompt = getUserPromptWithReferencePrompt(userPrompt, referenceCodePrompt);

      addUserMessageToCurrentConversation(combinedUserPrompt);

      const aiAgents = agents.filter((agent) => agent.type === "ai");
      aiAgents.forEach((agent) => resetAgentProgress(agent.id));

      return new Promise((resolve, reject) => {
        console.log("Emitting converse event:", {
          userPrompt: combinedUserPrompt,
          referenceCodePrompt: referenceCodePrompt,
          agents: aiAgents,
          conversationId: currentConversation.id
        });

        const handleResponse = (data) => {
          console.log('Received response from socket:', data);
          const { agent, position, token, conversation } = data;
          addAgentToken(agent, token);
        };

        const handleConversationComplete = (data) => {
          console.log('Conversation complete:', data);
          socket.off("response", handleResponse);
          socket.off("conversation_complete", handleConversationComplete);
          socket.off("error", handleError);
          resolve(data);
        };

        const handleError = (error) => {
          console.error('Socket error:', error);
          socket.off("response", handleResponse);
          socket.off("conversation_complete", handleConversationComplete);
          socket.off("error", handleError);
          reject(error);
        };

        socket.on("response", handleResponse);
        socket.on("conversation_complete", handleConversationComplete);
        socket.on("error", handleError);

        socket.emit("converse", {
          userPrompt: combinedUserPrompt,
          // referenceCodePrompt: referenceCodePrompt,
          // attachments: selectedReferencePaths,
          attachments: selectedReferencePaths.map(path => 
            `${rootReferencePath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
          ),
          agents: aiAgents.map(agent => ({
            id: agent.id,
            name: agent.name,
            model: agent.model,
            systemPrompt: agent.systemPrompt,
            temperature: agent.temperature,
            position: agent.position
          })),
          conversationId: currentConversation.id
        });
      });
    },
    [isConnected, socket, agents, config, addAgentToken]
  );

  return (
    <LLMContext.Provider
      value={{ handleSendPrompt, agentProgress, isConnected }}
    >
      {children}
    </LLMContext.Provider>
  );
};

export const useLLM = () => {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error("useLLM must be used within an LLMProvider");
  }
  return context;
};

export default LLMProvider;


// // src/contexts/LLMProvider.js

// import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
// import { getUserPromptWithReferencePrompt } from "../utils/promptUtils";
// import { useSocket } from "./SocketContext";
// import useStore from "../store/useStore";

// console.log("Initializing LLMContext");

// const LLMContext = createContext(null);

// export const LLMProvider = ({ children }) => {
//   const { socket, isConnected } = useSocket();
//   const [agentProgress, setAgentProgress] = useState({});

//   const { config, agents, updateAgent, addAgentToken } = useStore((state) => ({
//     config: state.config,
//     agents: state.agents,
//     updateAgent: state.updateAgent,
//     addAgentToken: state.addAgentToken
//   }));

//   useEffect(() => {
//     if (!socket) return;

//     const handleResponse = (data) => {
//       console.log('Received response from socket:', data);
//       const { agent, position, token, conversation } = data;
//       addAgentToken(agent, token);
//     };

//     const handleError = (error) => {
//       console.error('Socket error:', error);
//     };

//     socket.on("response", handleResponse);
//     socket.on("error", handleError);

//     return () => {
//       socket.off("response", handleResponse);
//       socket.off("error", handleError);
//     };
//   }, [socket, addAgentToken]);

//   const handleSendPrompt = useCallback(
//     async (userPrompt, referenceCodePrompt, targetAgentId = null) => {
//       if (!isConnected || !socket) {
//         console.error("Socket is not connected");
//         return;
//       }

//       const { addUserMessageToCurrentConversation, currentConversation, resetAgentProgress } =
//         useStore.getState();

//       let combinedUserPrompt = getUserPromptWithReferencePrompt(userPrompt, referenceCodePrompt);

//       addUserMessageToCurrentConversation(combinedUserPrompt);

//       const aiAgents = agents.filter((agent) => agent.type === "ai");
//       aiAgents.forEach((agent) => resetAgentProgress(agent.id));

//       return new Promise((resolve, reject) => {
//         socket.emit("converse", {
//           userPrompt: combinedUserPrompt,
//           referenceCodePrompt: referenceCodePrompt,
//           agents: aiAgents.map(agent => ({
//             id: agent.id,
//             name: agent.name,
//             model: agent.model,
//             systemPrompt: agent.systemPrompt,
//             temperature: agent.temperature,
//             position: agent.position
//           })),
//           conversationId: currentConversation.id
//         });

//         const handleConversationComplete = (data) => {
//           socket.off("conversation_complete", handleConversationComplete);
//           socket.off("error", handleError);
//           resolve(data);
//         };

//         const handleError = (error) => {
//           socket.off("conversation_complete", handleConversationComplete);
//           socket.off("error", handleError);
//           reject(error);
//         };

//         socket.on("conversation_complete", handleConversationComplete);
//         socket.on("error", handleError);
//       });
//     },
//     [isConnected, socket, agents, config]
//   );

//   return (
//     <LLMContext.Provider
//       value={{ handleSendPrompt, agentProgress, isConnected }}
//     >
//       {children}
//     </LLMContext.Provider>
//   );
// };

// export const useLLM = () => {
//   const context = useContext(LLMContext);
//   if (context === undefined) {
//     throw new Error("useLLM must be used within an LLMProvider");
//   }
//   return context;
// };

// export default LLMProvider;
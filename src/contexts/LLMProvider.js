import React, { createContext, useContext, useState, useCallback } from "react";
import { getUserPromptWithReferencePrompt } from "../utils/promptUtils";
import { useSocket } from "./SocketContext";
import useStore from "../store/useStore";

console.log("Initializing LLMContext");

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [agentProgress, setAgentProgress] = useState({});
  const { getAgentById } = useStore();

  const { config, agents, updateAgent, addAgentToken } = useStore((state) => ({
    config: state.config,
    agents: state.agents,
    updateAgent: state.updateAgent,
    addAgentToken: state.addAgentToken
  }));

  const handleSendPrompt = useCallback(
    async (userPrompt, referenceCodePrompt, targetAgentId = null) => {
      if (!isConnected) return;

      const { addUserMessageToCurrentConversation, addAgentResponse, currentConversation, resetAgentProgress } =
        useStore.getState();

      let combinedUserPrompt = getUserPromptWithReferencePrompt(userPrompt, referenceCodePrompt);

      addUserMessageToCurrentConversation(combinedUserPrompt);

      const aiAgents = agents.filter((agent) => agent.type === "ai");
      aiAgents.forEach((agent) => resetAgentProgress(agent.id));

      return new Promise((resolve, reject) => {
        socket.emit("converse", {
          userPrompt: combinedUserPrompt,
          referenceCodePrompt: referenceCodePrompt,
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

        socket.on("response", (data) => {
          const { agent, position, token, conversation } = data;
          addAgentToken(agent, token);
        });

        socket.on("conversation_complete", (data) => {
          resolve(data);
        });

        socket.on("error", (error) => {
          reject(error);
        });
      });
    },
    [isConnected, socket, agents, config]
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
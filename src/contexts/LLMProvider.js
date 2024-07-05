import React, { createContext, useContext, useState, useCallback } from "react";
import { getLastNMessagesAsString, getUserPromptWithReferencePrompt } from "../utils/promptUtils";
import { useSocket } from "./SocketContext";
import { agents, config, currentConversation, updateAgent, addAgentToken, addUserMessageToCurrentConversation, addAgentResponse, resetAgentProgress } from '../entities/main';
import { MAX_TOKENS } from "../constants";

console.log("Initializing LLMContext");

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [agentProgress, setAgentProgress] = useState({});

  const currentConfig = config.use();
  const currentAgents = agents.use();

  const query = useCallback(
    (userPrompt, agent, onChunk) => {
      if (!socket || !isConnected) {
        throw new Error("Socket is not connected.");
      }

      const { id, model, systemPrompt, temperature } = agent;
      const { systemMessagePreface } = currentConfig;
      const finalSystemPrompt = `${
        systemMessagePreface ? systemMessagePreface : ""
      }\n\n${systemPrompt}`.trim();

      console.log("final system prompt: ", finalSystemPrompt);
      return new Promise((resolve, reject) => {
        let fullResponse = "";

        socket.emit("generate", {
          userPrompt,
          model,
          temperature,
          agentId: id,
          systemPrompt: finalSystemPrompt,
        });

        const handleResponse = (data) => {
          if (data.agentId === id && data.text) {
            fullResponse += data.text;
            onChunk(data.text);
          }
        };

        const handleResponseComplete = (data) => {
          if (data.agentId === id) {
            cleanup();
            resolve(fullResponse);
          }
        };

        const handleError = (error) => {
          cleanup();
          reject(new Error(`LLM query error: ${error}`));
        };

        const cleanup = () => {
          socket.off("response", handleResponse);
          socket.off("response_complete", handleResponseComplete);
          socket.off("error", handleError);
        };

        socket.on("response", handleResponse);
        socket.on("response_complete", handleResponseComplete);
        socket.on("error", handleError);
      });
    },
    [isConnected, socket, currentConfig]
  );

  const handleSendPrompt = useCallback(
    async (userPrompt, referenceCodePrompt, targetAgentId = null) => {
      if (!isConnected) return;

      let combinedUserPrompt = getUserPromptWithReferencePrompt(userPrompt, referenceCodePrompt);

      addUserMessageToCurrentConversation(combinedUserPrompt);

      const aiAgents = currentAgents.filter((agent) => agent.type === "ai");
      aiAgents.forEach((agent) => resetAgentProgress(agent.id));

      const agentsByPosition = aiAgents.reduce((acc, agent) => {
        if (!acc[agent.position]) {
          acc[agent.position] = [];
        }
        acc[agent.position].push(agent);
        return acc;
      }, {});

      for (const position of Object.keys(agentsByPosition).sort(
        (a, b) => a - b
      )) {
        const agentsAtPosition = agentsByPosition[position];
        const agentsToProcess = targetAgentId
          ? agentsAtPosition.filter((agent) => agent.id === targetAgentId)
          : agentsAtPosition;

        const agentsResponses = await Promise.all(
          agentsToProcess.map(async (agent) => {
            try {
              let responseContent = "";

              const handleToken = (token) => {
                responseContent += token;
                addAgentToken(agent.id, token);
              };

              const userPromptForThisAgent = combinedUserPrompt + getLastNMessagesAsString(currentConversation.get(), agent.numLastMessagesWanted);
              console.log('userPromptForThisAgent',agent.name,userPromptForThisAgent);

              const fullResponse = await query(
                userPromptForThisAgent,
                agent,
                handleToken
              );

              return { agent, output: fullResponse };
            } catch (error) {
              const errorMessage = `Error: ${error.message}`;
              updateAgent(agent.id, { output: errorMessage });
              return { agent, output: errorMessage };
            }
          })
        );

        agentsResponses.forEach(({ agent, output }) => {
          addAgentResponse(agent.id, output);
        });

        if (targetAgentId) break;
      }
    },
    [currentAgents, query, isConnected]
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
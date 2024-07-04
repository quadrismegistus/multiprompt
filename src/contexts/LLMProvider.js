import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { makeAsciiSection } from "../utils/promptUtils";
import { useSocket } from "./SocketContext";
import useStore from "../store/useStore";
import { MAX_TOKENS } from "../constants";

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

  // const memoizedConfig = useMemo(() => config, [config]);

  const query = useCallback(
    (userPrompt, agent, onChunk) => {
      if (!socket || !isConnected) {
        throw new Error("Socket is not connected.");
      }

      const { id, model, systemPrompt, temperature } = agent;
      const { systemMessagePreface } = config;
      const finalSystemPrompt = `${
        systemMessagePreface ? systemMessagePreface : ""
      }\n\n${systemPrompt}`.trim();

      console.log("final system prompt: ", finalSystemPrompt);
      return new Promise((resolve, reject) => {
        let fullResponse = "";

        // console.log(userPrompt);
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
    [isConnected, socket, config]
  );

  const handleSendPrompt = useCallback(
    async (userPrompt, referenceCodePrompt, targetAgentId = null) => {
      if (!isConnected) return;

      const { addUserMessage, addAgentResponse, currentConversation } =
        useStore.getState();

      addUserMessage(userPrompt);

      const aiAgents = agents.filter((agent) => agent.type === "ai");
      aiAgents.forEach((agent) => {
        updateAgent(agent.id, { progress: 0, progressTokens: 0 });
      });

      const agentsByPosition = aiAgents.reduce((acc, agent) => {
        if (!acc[agent.position]) {
          acc[agent.position] = [];
        }
        acc[agent.position].push(agent);
        return acc;
      }, {});

      let userPromptSoFar = makeAsciiSection("User Prompt", userPrompt, 1);
      if (referenceCodePrompt) {
        userPromptSoFar += makeAsciiSection(
          "Appendix to user prompt with reference material",
          referenceCodePrompt,
          2
        );
      }

      console.log("currentConversation", currentConversation);
      // Integrate previous conversation history into userPromptSoFar
      currentConversation.forEach((msg, msgI) => {
        userPromptSoFar += makeAsciiSection(
          `${
            msg.sender === "User"
              ? "User Prompt"
              : `Response from ${getAgentById(msg.agentId).name}`
          }`,
          msg.content,
          1
        );
      });

      for (const position of Object.keys(agentsByPosition).sort(
        (a, b) => a - b
      )) {
        const agentsAtPosition = agentsByPosition[position];
        const agentsToProcess = targetAgentId
          ? agentsAtPosition.filter((agent) => agent.id === targetAgentId)
          : agentsAtPosition;

        const agentsPromises = agentsToProcess.map(async (agent) => {
          try {
            let responseContent = "";
            const handleToken = (token) => {
              responseContent += token;
              addAgentToken(agent.id, token);
            };

            const fullResponse = await query(
              userPromptSoFar,
              agent,
              handleToken
            );
            addAgentResponse(agent.id, fullResponse);
            return { agent, output: fullResponse };
          } catch (error) {
            const errorMessage = `Error: ${error.message}`;
            updateAgent(agent.id, { output: errorMessage });
            addAgentResponse(agent.id, errorMessage);
            return { agent, output: errorMessage };
          }
        });

        const positionOutputs = await Promise.all(agentsPromises);

        for (const { agent, output } of positionOutputs) {
          userPromptSoFar += makeAsciiSection(
            `Response from agent ${agent.name}`,
            output,
            1
          );
        }

        if (targetAgentId) break;
      }
    },
    [agents, query, isConnected, updateAgent]
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

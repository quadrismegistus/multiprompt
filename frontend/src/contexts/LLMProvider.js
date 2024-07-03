import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { makeAsciiSection } from '../utils/promptUtils';
import { useSocket } from './SocketContext';
import useStore from '../store/useStore';

console.log('Initializing LLMContext');

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
    const { socket, isConnected } = useSocket();
    const [agentProgress, setAgentProgress] = useState({});

    const {
        config,
        agents,
        updateAgent,
        addConversationHistory
    } = useStore(state => ({
        config: state.config,
        agents: state.agents,
        updateAgent: state.updateAgent,
        addConversationHistory: state.addConversationHistory
    }));

    const memoizedConfig = useMemo(() => config, [config]);

    const query = useCallback((userPrompt, agent, onChunk) => {
        if (!socket || !isConnected) {
            throw new Error('Socket is not connected.');
        }

        const { id, model, systemPrompt, temperature } = agent;

        return new Promise((resolve, reject) => {
            let fullResponse = '';

            socket.emit('generate', { userPrompt, model, systemPrompt, temperature, agentId: id });

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
                socket.off('response', handleResponse);
                socket.off('response_complete', handleResponseComplete);
                socket.off('error', handleError);
            };

            socket.on('response', handleResponse);
            socket.on('response_complete', handleResponseComplete);
            socket.on('error', handleError);
        });
    }, [isConnected, socket]);

    // const handleSendPrompt = useCallback(async (userPrompt, referenceCodePrompt) => {
    //     if (!isConnected) {
    //         return;
    //     }

    //     const aiAgents = agents.filter(agent => agent.type === 'ai');
    //     const agentsByPosition = aiAgents.reduce((acc, agent) => {
    //         if (!acc[agent.position]) {
    //             acc[agent.position] = [];
    //         }
    //         acc[agent.position].push(agent);
    //         return acc;
    //     }, {});

    //     let userPromptSoFar = makeAsciiSection("User Prompt", userPrompt, 1);
    //     if (referenceCodePrompt) {
    //         userPromptSoFar += makeAsciiSection("Appendix to user prompt with reference material", referenceCodePrompt, 2);
    //     }
    //     const conversation = [];

    //     for (const position of Object.keys(agentsByPosition).sort((a, b) => a - b)) {
    //         const agentsAtPosition = agentsByPosition[position];
    //         const agentsPromises = agentsAtPosition.map(async agent => {
    //             try {
    //                 let responseContent = '';
    //                 const maxTokens = 4096;

    //                 const handleChunk = (chunk) => {
    //                     responseContent += chunk;
    //                     const progressPercentage = Math.min((responseContent.length / maxTokens) * 100, 100);
    //                     setAgentProgress(prev => ({ ...prev, [agent.id]: progressPercentage }));
    //                     if(chunk.includes("\n")) {
    //                         updateAgent(agent.id, { output: responseContent + '█' });
    //                     }
    //                 };

    //                 const fullResponse = await query(userPromptSoFar, agent, handleChunk);

    //                 updateAgent(agent.id, { output: fullResponse });
    //                 setAgentProgress(prev => ({ ...prev, [agent.id]: 100 }));
    //                 return { agent, output: fullResponse };
    //             } catch (error) {
    //                 const errorMessage = `Error: ${error.message}`;
    //                 updateAgent(agent.id, { output: errorMessage });
    //                 return { agent, output: errorMessage };
    //             }
    //         });

    //         const positionOutputs = await Promise.all(agentsPromises);

    //         for (const { agent, output } of positionOutputs) {
    //             userPromptSoFar += makeAsciiSection(`Response from agent ${agent.name}`, output, 1);
    //             conversation.push({ agent, output });
    //         }
    //     }

    //     addConversationHistory(conversation);
    // }, [agents, query, isConnected, updateAgent, addConversationHistory]);


  const handleSendPrompt = useCallback(async (userPrompt, referenceCodePrompt, targetAgentId = null) => {
    if (!isConnected) return;

    const {
      addUserMessage,
      addAgentResponse,
      currentConversationId
    } = useStore.getState();

    addUserMessage(userPrompt);

    const aiAgents = agents.filter(agent => agent.type === 'ai');
    const agentsByPosition = aiAgents.reduce((acc, agent) => {
      if (!acc[agent.position]) {
        acc[agent.position] = [];
      }
      acc[agent.position].push(agent);
      return acc;
    }, {});

    let userPromptSoFar = makeAsciiSection("User Prompt", userPrompt, 1);
    if (referenceCodePrompt) {
      userPromptSoFar += makeAsciiSection("Appendix to user prompt with reference material", referenceCodePrompt, 2);
    }

    for (const position of Object.keys(agentsByPosition).sort((a, b) => a - b)) {
      const agentsAtPosition = agentsByPosition[position];
      const agentsToProcess = targetAgentId 
        ? agentsAtPosition.filter(agent => agent.id === targetAgentId)
        : agentsAtPosition;

      const agentsPromises = agentsToProcess.map(async agent => {
        try {
          let responseContent = '';
          const maxTokens = 4096;

          const handleChunk = (chunk) => {
            responseContent += chunk;
            const progressPercentage = Math.min((responseContent.length / maxTokens) * 100, 100);
            setAgentProgress(prev => ({ ...prev, [agent.id]: progressPercentage }));
            updateAgent(agent.id, { output: responseContent + '█' });
          };

          const fullResponse = await query(userPromptSoFar, agent, handleChunk);

          updateAgent(agent.id, { output: fullResponse });
          setAgentProgress(prev => ({ ...prev, [agent.id]: 100 }));
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
        userPromptSoFar += makeAsciiSection(`Response from agent ${agent.name}`, output, 1);
      }

      if (targetAgentId) break; // Stop after processing the target agent
    }
  }, [agents, query, isConnected, updateAgent]);

    return (
        <LLMContext.Provider value={{ handleSendPrompt, agentProgress, isConnected }}>
            {children}
        </LLMContext.Provider>
    );
};

export const useLLM = () => {
    const context = useContext(LLMContext);
    if (context === undefined) {
        throw new Error('useLLM must be used within an LLMProvider');
    }
    return context;
};

export default LLMProvider;
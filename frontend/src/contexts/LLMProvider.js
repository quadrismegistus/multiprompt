import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { useConfig } from './ConfigContext';
import { useAgents } from './AgentContext';
import { SOCKET_SERVER_URL } from '../constants';
import { makeAsciiSection } from '../utils/promptUtils';
import { addConversationHistory } from '../redux/actions';
import { useSocket } from './SocketContext';

console.log('Initializing LLMContext');

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
    const { config } = useConfig();
    const { agents, updateAgent } = useAgents();
    const dispatch = useDispatch();
    const { socket, isConnected } = useSocket();
    const [agentProgress, setAgentProgress] = useState({});

    const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
    const userPrompt = useSelector(state => state.config.userPrompt);

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

    const handleSendPrompt = useCallback(async (userPrompt, referenceCodePrompt) => {
        if (!isConnected) {
            return;
        }

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
        const conversation = [];

        for (const position of Object.keys(agentsByPosition).sort((a, b) => a - b)) {
            const agentsAtPosition = agentsByPosition[position];
            const agentsPromises = agentsAtPosition.map(async agent => {
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
                    return { agent, output: fullResponse };
                } catch (error) {
                    const errorMessage = `Error: ${error.message}`;
                    updateAgent(agent.id, { output: errorMessage });
                    return { agent, output: errorMessage };
                }
            });

            const positionOutputs = await Promise.all(agentsPromises);

            for (const { agent, output } of positionOutputs) {
                userPromptSoFar += makeAsciiSection(`Response from agent ${agent.name}`, output, 1);
                conversation.push({ agent, output });
            }
        }

        dispatch(addConversationHistory(conversation));
    }, [agents, query, isConnected, updateAgent, dispatch]);

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

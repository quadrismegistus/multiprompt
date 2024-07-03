import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { useConfig } from './ConfigContext';
import { useAgents } from './AgentContext';
import { SOCKET_SERVER_URL } from '../constants';
import { makeAsciiSection } from '../utils/promptUtils';
import { addConversationHistory } from '../redux/actions';

console.log('Initializing LLMContext');

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
    console.log('Rendering LLMProvider');
    const { config } = useConfig();
    const { agents, updateAgent } = useAgents();
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [agentProgress, setAgentProgress] = useState({});

    const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
    const userPrompt = useSelector(state => state.config.userPrompt);

    const memoizedConfig = useMemo(() => config, [config]);

    console.log('Current config:', memoizedConfig);
    console.log('Current agents:', agents);

    useEffect(() => {
        console.log('Setting up socket connection');
        socketRef.current = io(SOCKET_SERVER_URL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to LLM server');
            setIsConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from LLM server');
            setIsConnected(false);
        });

        socketRef.current.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return () => {
            console.log('Cleaning up socket connection');
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [memoizedConfig]);

    const query = useCallback((userPrompt, agent, onChunk) => {
        console.log('Initiating query');
        if (!socketRef.current || !isConnected) {
            console.error('Socket is not connected.');
            throw new Error('Socket is not connected.');
        }

        const { id, model, systemPrompt, temperature } = agent;
        console.log('Querying with:', { userPrompt, model, systemPrompt, temperature, agentId: id });

        return new Promise((resolve, reject) => {
            let fullResponse = '';

            socketRef.current.emit('generate', { userPrompt, model, systemPrompt, temperature, agentId: id });

            const handleResponse = (data) => {
                if (data.agentId === id && data.text) {
                    console.log('Received chunk for agent:', id, data.text);
                    fullResponse += data.text;
                    onChunk(data.text);
                }
            };

            const handleResponseComplete = (data) => {
                if (data.agentId === id) {
                    console.log('Response complete for agent:', id);
                    cleanup();
                    resolve(fullResponse);
                }
            };

            const handleError = (error) => {
                console.error('LLM query error:', error);
                cleanup();
                reject(new Error(`LLM query error: ${error}`));
            };

            const cleanup = () => {
                socketRef.current.off('response', handleResponse);
                socketRef.current.off('response_complete', handleResponseComplete);
                socketRef.current.off('error', handleError);
            };

            socketRef.current.on('response', handleResponse);
            socketRef.current.on('response_complete', handleResponseComplete);
            socketRef.current.on('error', handleError);
        });
    }, [isConnected]);

    const handleSendPrompt = useCallback(async (userPrompt, referenceCodePrompt) => {
        console.log('Handling send prompt');
        if (!isConnected) {
            console.error('Not connected to the LLM server');
            return;
        }

        const aiAgents = agents.filter(agent => agent.type === 'ai');
        console.log('AI agents:', aiAgents);
        const agentsByPosition = aiAgents.reduce((acc, agent) => {
            if (!acc[agent.position]) {
                acc[agent.position] = [];
            }
            acc[agent.position].push(agent);
            return acc;
        }, {});
        console.log('Agents by position:', agentsByPosition);

        let userPromptSoFar = makeAsciiSection("User Prompt", userPrompt, 1);
        if (referenceCodePrompt) {
            userPromptSoFar += makeAsciiSection("Appendix to user prompt with reference material", referenceCodePrompt, 2);
        }
        console.log('Initial user prompt:', userPromptSoFar);
        const conversation = [];

        for (const position of Object.keys(agentsByPosition).sort((a, b) => a - b)) {
            console.log('Processing position:', position);
            console.log('Current user prompt:', userPromptSoFar);

            const agentsAtPosition = agentsByPosition[position];
            const agentsPromises = agentsAtPosition.map(async agent => {
                console.log('Processing agent:', agent.name);
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

                    console.log('Full response for agent:', agent.name, fullResponse);
                    updateAgent(agent.id, { output: fullResponse });
                    setAgentProgress(prev => ({ ...prev, [agent.id]: 100 }));
                    return { agent, output: fullResponse };
                } catch (error) {
                    console.error('Error processing agent:', agent.name, error);
                    const errorMessage = `Error: ${error.message}`;
                    updateAgent(agent.id, { output: errorMessage });
                    return { agent, output: errorMessage };
                }
            });

            const positionOutputs = await Promise.all(agentsPromises);
            console.log('Position outputs:', positionOutputs);

            for (const { agent, output } of positionOutputs) {
                userPromptSoFar += makeAsciiSection(`Response from agent ${agent.name}`, output, 1);
                conversation.push({ agent, output });
            }
        }

        console.log('Final conversation:', conversation);
        dispatch(addConversationHistory(conversation));
    }, [agents, query, isConnected, updateAgent, dispatch]);

    console.log('Rendering LLMContext.Provider');
    return (
        <LLMContext.Provider value={{ handleSendPrompt, agentProgress, isConnected }}>
            {children}
        </LLMContext.Provider>
    );
};

export const useLLM = () => {
    console.log('Using LLM context');
    const context = useContext(LLMContext);
    if (context === undefined) {
        console.error('useLLM must be used within an LLMProvider');
        throw new Error('useLLM must be used within an LLMProvider');
    }
    return context;
};

console.log('LLMContext module loaded');

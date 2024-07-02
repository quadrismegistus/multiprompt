import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { useConfig } from './ConfigContext';
import { useAgents } from './AgentContext';
import { SOCKET_SERVER_URL } from '../constants';
import { makeAsciiSection } from '../utils/promptUtils';
import { addConversationHistory } from '../redux/actions';

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
  const { config } = useConfig();
  const { agents, updateAgent } = useAgents();
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agentProgress, setAgentProgress] = useState({});

  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt);

  useEffect(() => {
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
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [config]);

  const query = useCallback((userPrompt, agent, onChunk) => {
    if (!socketRef.current || !isConnected) {
      throw new Error('Socket is not connected.');
    }

    const { model, systemPrompt, temperature } = agent;
    console.log('Querying with:', userPrompt, model, systemPrompt, temperature);

    return new Promise((resolve, reject) => {
      let fullResponse = '';
      
      socketRef.current.emit('generate', { userPrompt, model, systemPrompt, temperature });

      socketRef.current.on('response', (data) => {
        if (data.text) {
          fullResponse += data.text;
          onChunk(data.text);
        }
      });

      socketRef.current.on('response_complete', (data) => {
        socketRef.current.off('response');
        socketRef.current.off('response_complete');
        socketRef.current.off('error');
        resolve(fullResponse);
      });

      socketRef.current.on('error', (error) => {
        socketRef.current.off('response');
        socketRef.current.off('response_complete');
        socketRef.current.off('error');
        reject(new Error(`LLM query error: ${error}`));
      });
    });
  }, [isConnected]);

  const handleSendPrompt = useCallback(async () => {
    if (!isConnected) {
      console.error('Not connected to the LLM server');
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

    let userPromptSoFar = makeAsciiSection("User Prompt", userPrompt, 1)
    if (referenceCodePrompt) {
      userPromptSoFar += makeAsciiSection("Appendix to user prompt with reference material", referenceCodePrompt, 2)
    }
    const conversation = [];

    for (const position of Object.keys(agentsByPosition).sort((a, b) => a - b)) {
      console.log('at position', position, 'user prompt is', userPromptSoFar);

      const agentsAtPosition = agentsByPosition[position];
      const agentsPromises = agentsAtPosition.map(async agent => {
        try {
          let responseContent = '';
          const maxTokens = 4096; // You might want to adjust this or get it from the agent config

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
        userPromptSoFar += makeAsciiSection(`Response from agent ${agent.name}`, output, 1)
        conversation.push({ agent, output });
      }
    }

    dispatch(addConversationHistory(conversation));  
  }, [agents, query, isConnected, userPrompt, referenceCodePrompt, updateAgent, dispatch]);

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
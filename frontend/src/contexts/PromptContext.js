// src/contexts/PromptContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApiClients } from './LLMProvider';
import { useAgents } from './AgentContext';
import { makeAsciiSection } from '../utils/promptUtils';
import { addConversationHistory } from '../redux/actions';

const PromptContext = createContext();

export const PromptProvider = ({ children }) => {
  const { agents, updateAgent } = useAgents();
  const { query, isConnected } = useApiClients();
  const dispatch = useDispatch();
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt);

  const [agentProgress, setAgentProgress] = useState({});

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
    <PromptContext.Provider value={{ handleSendPrompt, agentProgress, isConnected }}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompt = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompt must be used within a PromptProvider');
  }
  return context;
};
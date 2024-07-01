// src/contexts/PromptContext.js
import React, { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApiClients } from './LLMProvider';
import { useAgents } from './AgentContext';
import { updateAgent } from '../redux/actions';
import { formatPromptMessages } from '../utils/promptUtils';

const PromptContext = createContext();

export const PromptProvider = ({ children }) => {
  const { agents, updateAgent } = useAgents();
  const { query } = useApiClients();
  const dispatch = useDispatch();
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt);

  const handleSendPrompt = async () => {
    const aiAgents = agents.filter(agent => agent.type === 'ai');
    let prevOutput = "";

    for (const agent of aiAgents) {
      const formattedPrompt = formatPromptMessages(userPrompt, referenceCodePrompt, prevOutput);

      const userMessage = {
        role: 'user',
        content: formattedPrompt,
      };

      const systemMessage = agent.systemPrompt
        ? { role: 'system', content: agent.systemPrompt }
        : { role: 'system', content: 'You are a helpful assistant.' };

      const messages = [systemMessage, userMessage];

      try {
        let responseContent = '';
        for await (const chunk of query(agent.model, messages, agent.temperature)) {
          responseContent += chunk;
          updateAgent(agent.id, { output: responseContent + '█' });
        }
        updateAgent(agent.id, { output: responseContent });

        prevOutput = responseContent;
      } catch (error) {
        updateAgent(agent.id, { output: `Error: ${error.message}` });
      }
    }
  };

  return (
    <PromptContext.Provider value={{ handleSendPrompt }}>
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

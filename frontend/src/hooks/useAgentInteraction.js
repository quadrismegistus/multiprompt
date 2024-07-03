// src/hooks/useAgentInteraction.js
import { useState } from 'react';
import { useApiClients } from '../contexts/LLMProvider';

export const useAgentInteraction = (agent) => {
  const [output, setOutput] = useState('');
  const { query } = useApiClients();

  const interact = async (messages) => {
    const messageChunks = [];
    for await (const chunk of query(agent.model, messages)) {
      messageChunks.push(chunk);
      setOutput(prev => prev + chunk);
    }
    return messageChunks.join('');
  };

  return { output, interact };
};
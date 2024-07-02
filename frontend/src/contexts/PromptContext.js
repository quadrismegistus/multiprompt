import React, { createContext, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApiClients } from './LLMProvider';
import { useAgents } from './AgentContext';
import { updateAgent } from '../redux/actions';
import { formatPromptMessages, makeAsciiSection } from '../utils/promptUtils';
import { UserRoundPlus } from 'lucide-react';
import { DEFAULT_SYSTEM_PROMPT } from '../constants';

import { addConversationHistory } from '../redux/actions';
const PromptContext = createContext();

export const PromptProvider = ({ children }) => {
  const { agents, updateAgent } = useAgents();
  const { query } = useApiClients();
  const dispatch = useDispatch();
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt);

  const [agentProgress, setAgentProgress] = useState({});

  const handleSendPrompt = async () => {
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
      console.log('at position',position,'user prompt is',userPromptSoFar);

      const agentsAtPosition = agentsByPosition[position];
      const agentsPromises = agentsAtPosition.map(async agent => {
        const userMessage = {
          role: 'user',
          content: userPromptSoFar,
        };
        const systemMessage = agent.systemPrompt
          ? { role: 'system', content: agent.systemPrompt }
          : { role: 'system', content: DEFAULT_SYSTEM_PROMPT };
        const messages = [systemMessage, userMessage];

        try {
          let responseContent = '';
          let chunksReturned = 0;
          const maxTokens = 4096;

          for await (const chunk of query(agent.model, messages, agent.temperature)) {
            responseContent += chunk;
            chunksReturned += chunk.length;
            const progressPercentage = Math.min((chunksReturned / maxTokens) * 100, 100);
            setAgentProgress(prev => ({ ...prev, [agent.id]: progressPercentage }));
            updateAgent(agent.id, { output: responseContent + '█' });
          }
          updateAgent(agent.id, { output: responseContent });
          setAgentProgress(prev => ({ ...prev, [agent.id]: 100 }));
          return { agent, output: responseContent };
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
  };

  return (
    <PromptContext.Provider value={{ handleSendPrompt, agentProgress }}>
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
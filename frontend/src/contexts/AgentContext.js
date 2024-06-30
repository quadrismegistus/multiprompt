import React, { createContext, useState, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AgentContext = createContext();

export const AgentProvider = ({ children }) => {
  const [agents, setAgents] = useState([
    { id: 'user', name: 'User', type: 'user' },
    { id: uuidv4(), name: 'Agent 1', type: 'ai', model: 'gpt-3.5-turbo' }
  ]);

  const addAgent = () => {
    setAgents(prev => [...prev, {
      id: uuidv4(),
      name: `Agent ${prev.length}`,
      type: 'ai',
      model: 'gpt-3.5-turbo'
    }]);
  };

  const removeAgent = (id) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
  };

  const updateAgent = (id, updates) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    ));
  };

  return (
    <AgentContext.Provider value={{ agents, addAgent, removeAgent, updateAgent }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgents = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
};
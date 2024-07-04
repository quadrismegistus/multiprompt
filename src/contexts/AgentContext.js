import React, { createContext, useContext } from 'react';
import useStore from '../store/useStore';

const AgentContext = createContext();

export const AgentProvider = ({ children }) => {
  const {
    agents,
    addAgent,
    removeAgent,
    updateAgent,
    moveAgentTo
  } = useStore();

  return (
    <AgentContext.Provider value={{ agents, addAgent, removeAgent, updateAgent, moveAgentTo }}>
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
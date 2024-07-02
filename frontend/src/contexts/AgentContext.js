import React, { createContext, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_MODEL } from '../constants';

const AgentContext = createContext();

export const AgentProvider = ({ children }) => {
  const agents = useSelector(state => state.agents.agents);
  const dispatch = useDispatch();

  const addAgent = (clickedAgentPosition) => {
    const newAgent = {
      id: uuidv4(),
      name: `Agent ${agents.length + 1}`,
      type: 'ai',
      model: DEFAULT_MODEL,
      position: clickedAgentPosition,
    };
    dispatch({ type: 'ADD_AGENT', payload: newAgent });
  };

  const removeAgent = (id) => {
    dispatch({ type: 'REMOVE_AGENT', payload: id });
  };

  const updateAgent = (id, updates) => {
    dispatch({ type: 'UPDATE_AGENT', payload: { id, updates } });
    if (updates.output && !updates.output.endsWith('█')) {
      // When the agent finishes processing, set progress to 100%
      dispatch({ type: 'UPDATE_AGENT', payload: { id, updates: { progress: 100 } } });
    }
  };

  const moveAgentTo = (agentId, newPosition) => {
    dispatch({'type': 'MOVE_AGENT_TO', 'payload': {id:agentId, position:newPosition}});
  }

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

import React from 'react';
import { useAgents } from '../contexts/AgentContext';
import AgentColumn from './AgentColumn';

function AgentColumns() {
  const { agents, addAgent, removeAgent, updateAgent } = useAgents();

  if (!agents) {
    return null; // or return a loading indicator
  }

  const aiAgents = agents.filter(agent => agent.type === 'ai');

  return (
    <>
      {aiAgents.map((agent) => (
        <AgentColumn
          key={agent.id}
          agent={agent}
          onRemove={() => removeAgent(agent.id)}
          onAdd={addAgent}
          isOnlyColumn={aiAgents.length === 1}
          onUpdateAgent={(updates) => updateAgent(agent.id, updates)}
        />
      ))}
    </>
  );
}

export default AgentColumns;
import React from 'react';
import { useAgents } from '../contexts/AgentContext';
import AgentColumn from './AgentColumn';

function AgentColumns() {
  const { agents, addAgent, removeAgent, updateAgent } = useAgents();

  if (!agents) {
    return null;
  }

  const aiAgents = agents.filter(agent => agent.type === 'ai').sort((a, b) => a.position - b.position);

  return (
    <>
      {aiAgents.map((agent, index) => (
        <AgentColumn
          key={agent.id}
          agent={agent}
          onRemove={() => removeAgent(agent.id)}
          onAdd={addAgent}
          isOnlyColumn={aiAgents.length === 1}
          isLeftmostAgent={index === 0}
          isRightmostAgent={index === aiAgents.length - 1}
          onUpdateAgent={(updates) => updateAgent(agent.id, updates)}
        />
      ))}
    </>
  );
}

export default AgentColumns;
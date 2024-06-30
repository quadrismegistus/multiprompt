import React from 'react';
import AgentColumn from './AgentColumn';

function AgentColumns({ agents, models, onAddAgent, onRemoveAgent, onUpdateAgent }) {
  const isOnlyColumn = agents.length === 1;

  return (
    <>
      {agents.map((agent, index) => (
        <div key={agent.id} className="column">
          <AgentColumn
            agent={agent}
            models={models}
            onRemove={() => onRemoveAgent(agent.id)}
            onAdd={() => onAddAgent(agent.id)}
            isOnlyColumn={isOnlyColumn}
            onUpdateAgent={onUpdateAgent}
          />
        </div>
      ))}
    </>
  );
}

export default AgentColumns;
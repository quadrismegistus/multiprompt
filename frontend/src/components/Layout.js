import React from 'react';
import { useSelector } from 'react-redux';
import UserColumn from './UserColumn';
import AgentColumn from './AgentColumn';
import { GridLayout, GridCard } from './GridLayout';
import { useAgents } from '../contexts/AgentContext';

function Layout() {
  const isDarkMode = useSelector(state => state.config.isDarkMode);
  const { agents, addAgent, removeAgent, updateAgent } = useAgents();

  const sortedAgents = [...agents].sort((a, b) => a.position - b.position);

  return (
    <div className={`Layout ${isDarkMode ? 'dark' : ''}`}>
      <GridLayout>
        <GridCard columnPosition={0}>
          <UserColumn />
        </GridCard>
        {sortedAgents.filter(agent => agent.type === 'ai').map((agent) => (
          <GridCard key={agent.id} columnPosition={agent.position}>
            <AgentColumn 
              agent={agent} 
              onAdd={addAgent}
              onRemove={() => removeAgent(agent.id)}
              onUpdateAgent={(updates) => updateAgent(agent.id, updates)}
              isOnlyColumn={agents.filter(a => a.type === 'ai').length === 1}
            />
          </GridCard>
        ))}
      </GridLayout>
    </div>
  );
}

export default Layout;
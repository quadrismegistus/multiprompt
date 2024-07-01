import React from 'react';
import { useSelector } from 'react-redux';
import UserColumn from './UserColumn';
import AgentColumn from './AgentColumn';
import { GridLayout, GridCard } from './GridLayout';
import { useAgents } from '../contexts/AgentContext';

function Layout() {
  const isDarkMode = useSelector(state => state.config.isDarkMode);
  const { agents, addAgent, removeAgent, updateAgent } = useAgents();

  return (
    <div className={`Layout ${isDarkMode ? 'dark' : ''}`}>
      <GridLayout>
        <GridCard columnPosition={0}>
          <UserColumn />
        </GridCard>
        {agents.filter(agent => agent.type === 'ai').map((agent) => (
          <GridCard key={agent.id} columnPosition={agent.position}>
            <AgentColumn 
              agent={agent} 
              onAdd={addAgent}
              onRemove={() => removeAgent(agent.id)}
              onUpdateAgent={(updates) => updateAgent(agent.id, updates)}
              isOnlyColumn={agents.filter(a => a.type === 'ai').length === 1}
              isLeftmostAgent={agent.position === Math.min(...agents.filter(a => a.type === 'ai').map(a => a.position))}
              isRightmostAgent={agent.position === Math.max(...agents.filter(a => a.type === 'ai').map(a => a.position))}
            />
          </GridCard>
        ))}
      </GridLayout>
    </div>
  );
}

export default Layout;
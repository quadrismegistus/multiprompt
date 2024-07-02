import React from 'react';
import { useSelector } from 'react-redux';
import UserCard from './UserCard';
import AgentCard from './AgentCard';
import { GridLayout, GridCard } from './GridLayout';
import { useAgents } from '../contexts/AgentContext';
import IconSidebar from './IconSidebar';

function Layout() {
  const isDarkMode = useSelector(state => state.config.isDarkMode);
  const { agents } = useAgents();

  const sortedAgents = [...agents].sort((a, b) => a.position - b.position);

  return (
    <div className={`Layout ${isDarkMode ? 'dark' : ''}`}>
      <IconSidebar /> {/* Add this line */}
      <GridLayout classname='GridLayout'>
        <GridCard columnPosition={0}>
          <UserCard />
        </GridCard>
        {sortedAgents.filter(agent => agent.type === 'ai').map((agent) => (
          <GridCard key={agent.id} columnPosition={agent.position}>
            <AgentCard agent={agent} />
          </GridCard>
        ))}
        {/* <GridCard columnPosition={sortedAgents.length + 1}> */}
          {/* <ConversationHistory /> */}
        {/* </GridCard> */}
      </GridLayout>
    </div>
  );
}

export default Layout;

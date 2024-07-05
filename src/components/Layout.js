import React from 'react';
import { Container, Col } from 'react-bootstrap';
import UserCard from './UserCard';
import AgentCard from './AgentCard';
import IconSidebar from './IconSidebar';
import { agents, isDarkMode } from '../entities/main';

function Layout() {
  const currentAgents = agents.use();
  const darkMode = isDarkMode.use();

  const sortedAgents = [...currentAgents].sort((a, b) => a.position - b.position);
  const numCols = sortedAgents.length + 1;

  const agentsByPosition = sortedAgents.reduce((acc, agent) => {
    if (!acc[agent.position]) {
      acc[agent.position] = [];
    }
    acc[agent.position].push(agent);
    return acc;
  }, {});

  return (
    <Container className={`Layout ${darkMode ? 'dark' : ''}`}>
      <IconSidebar />
      <Col key={0} style={{ maxWidth: `calc(100vw / ${numCols})` }} className='last-in-position agentpos-0'>
        <UserCard />
      </Col>
      {Object.entries(agentsByPosition).map(([position, agentsInPosition]) => (
        agentsInPosition.map((agent, index) => (
          <Col 
            key={agent.id} 
            className={`agentpos-${agent.position} ${index === agentsInPosition.length - 1 ? 'last-in-position' : ''}`} 
            style={{ maxWidth: `calc(100vw / ${numCols})` }}
          >
            <AgentCard agent={agent} />
          </Col>
        ))
      ))}
    </Container>
  );
}

export default Layout;
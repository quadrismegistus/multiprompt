import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import UserCard from './UserCard';
import AgentCard from './AgentCard';
import { GridLayout, GridCard } from './GridLayout';
import IconSidebar from './IconSidebar';
import useStore from '../store/useStore';

function Layout() {
  const agents = useStore((state) => state.agents);
  const isDarkMode = useStore((state) => state.config.isDarkMode);

  const sortedAgents = [...agents].sort((a, b) => a.position - b.position);
  const numCols = sortedAgents.length + 1;
  console.log(numCols,'mi,')

  return (
    <Container className={`Layout ${isDarkMode ? 'dark' : ''}`}>
      <IconSidebar />

      {/* <GridLayout classname='GridLayout'>
        <GridCard columnPosition={0}>
          <UserCard />
        </GridCard>
        {sortedAgents.filter(agent => agent.type === 'ai').map((agent) => (
          <GridCard key={agent.id} columnPosition={agent.position}>
            <AgentCard agent={agent} />
          </GridCard>
        ))}
      </GridLayout> */}
      <Col key={0} style={{ maxWidth: `calc(100vw / ${numCols})`}}><UserCard /></Col>
      {sortedAgents.filter(agent => agent.type === 'ai').map((agent) => (
          <Col key={agent.id}  style={{ maxWidth: `calc(100vw / ${numCols})`}}>
            <AgentCard agent={agent} />
          </Col>
        ))}
    </Container>
  );
}

export default Layout;

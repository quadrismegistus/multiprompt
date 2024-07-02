import React, { useState } from 'react'; // Import useState
import { Button, Offcanvas } from 'react-bootstrap'; // Import Offcanvas
import { useSelector } from 'react-redux';
import UserCard from './UserCard';
import AgentCard from './AgentCard';
import { GridLayout, GridCard } from './GridLayout';
import { useAgents } from '../contexts/AgentContext';
import ConversationHistory from './ConversationHistory';

function Layout() {
  const isDarkMode = useSelector(state => state.config.isDarkMode);
  const { agents } = useAgents();
  const [showHistory, setShowHistory] = useState(false); // State for Offcanvas visibility

  const sortedAgents = [...agents].sort((a, b) => a.position - b.position);

  const handleClose = () => setShowHistory(false);
  const handleShow = () => setShowHistory(true);

  return (
    <div className={`Layout ${isDarkMode ? 'dark' : ''}`}>
      <Button variant="primary" onClick={handleShow}>Show History</Button> {/* Toggle Button */}
      <Offcanvas show={showHistory} onHide={handleClose} placement="start"> {/* Offcanvas */}
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Conversation History</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ConversationHistory />
        </Offcanvas.Body>
      </Offcanvas>
      <GridLayout>
        <GridCard columnPosition={0}>
          <UserCard />
        </GridCard>
        {sortedAgents.filter(agent => agent.type === 'ai').map((agent) => (
          <GridCard key={agent.id} columnPosition={agent.position}>
            <AgentCard agent={agent} />
          </GridCard>
        ))}
        {}
          {}
        {}
      </GridLayout>
    </div>
  );
}

export default Layout;
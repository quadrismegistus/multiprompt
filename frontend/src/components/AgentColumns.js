
import React from 'react';
import { Col, Row, Container } from 'react-bootstrap';
import { useAgents } from '../contexts/AgentContext';
import AgentColumn from './AgentColumn';

function AgentColumns() {
  const { agents, addAgent, removeAgent, updateAgent } = useAgents();

  if (!agents) {
    return null;
  }

  const aiAgents = agents.filter(agent => agent.type === 'ai');
  const groupedAgents = aiAgents.reduce((acc, agent) => {
    if (!acc[agent.position]) {
      acc[agent.position] = [];
    }
    acc[agent.position].push(agent);
    return acc;
  }, {});

  const sortedPositions = Object.keys(groupedAgents).sort((a, b) => Number(a) - Number(b));

  return (
    <Container fluid className="h-100">
      <Row className="h-100">
        {sortedPositions.map((position) => {
          const agentsInPosition = groupedAgents[position];
          const rowHeight = Math.floor(12 / agentsInPosition.length);
          
          return (
            <Col key={position} className="agent-col useragent-col h-100 p-0" xs={12} md={12 / sortedPositions.length}>
              {agentsInPosition.map((agent, index) => (
                <Row key={agent.id} className={`agent-row h-${rowHeight}`}>
                  <Col className="h-100 p-0">
                    <AgentColumn
                      agent={agent}
                      onRemove={() => removeAgent(agent.id)}
                      onAdd={addAgent}
                      isOnlyColumn={aiAgents.length === 1}
                      isLeftmostAgent={position === sortedPositions[0]}
                      isRightmostAgent={position === sortedPositions[sortedPositions.length - 1]}
                      onUpdateAgent={(updates) => updateAgent(agent.id, updates)}
                    />
                  </Col>
                </Row>
              ))}
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}

export default AgentColumns;
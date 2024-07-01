
import React from 'react';
import { Row, Container, Col, Accordion } from 'react-bootstrap';
import AgentConfigForm from './AgentConfigForm'; // Import the new component

function AgentConfigAccordion({ agent, onNameChange, onModelChange, onSourceTypeChange, onSystemPromptChange }) {
  return (
    <Container fluid className="px-0">
      <Row className="align-items-center">
        <Col>
          <Accordion className='agentconfig'>
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                {agent.name} ({agent.model})
              </Accordion.Header>
              <Accordion.Body>
                <AgentConfigForm
                  agent={agent}
                  onNameChange={onNameChange}
                  onModelChange={onModelChange}
                  onSourceTypeChange={onSourceTypeChange}
                  onSystemPromptChange={onSystemPromptChange}
                />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
}

export default AgentConfigAccordion;
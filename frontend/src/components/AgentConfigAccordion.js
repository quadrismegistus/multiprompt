import React from 'react';
import { Row, Container, Col, Accordion } from 'react-bootstrap';
import AgentConfigForm from './AgentConfigForm';

function AgentConfigAccordion({ agent, onNameChange, onModelChange, onSystemPromptChange, onTemperatureChange }) {
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
                  onSystemPromptChange={onSystemPromptChange}
                  onTemperatureChange={onTemperatureChange}
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
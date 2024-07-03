import React from 'react';
import { Row, Container, Col, Accordion } from 'react-bootstrap';
import AgentConfigForm from './AgentConfigForm';
import { MODEL_DICT_r } from '../constants';

function AgentConfigAccordion({ agent, onNameChange, onModelChange, onSystemPromptChange, onTemperatureChange }) {
  return (
    <Container fluid className="px-0">
      <Row className="align-items-center">
        <Col>
          <Accordion className='agentconfig'>
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                {agent.name}
                <span style={{
                  fontFamily: "monospace", 
                  fontSize: ".8em", 
                  lineHeight: 'normal',
                  fontStyle: "italic",
                  marginLeft: ".5em",
                  // marginTop:".5em"
                }}>
                  ({MODEL_DICT_r[agent.model]}) [{agent.position}]
                </span>
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
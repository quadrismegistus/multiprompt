import React from 'react';
import { Row, Container, Col, Accordion, Form, Dropdown, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { MODEL_CATEGORIES, MODEL_LIST } from '../constants';

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
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Agent Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={agent.name}
                      onChange={onNameChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Model</Form.Label>
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" id="dropdown-model">
                        {agent.model ? `(${agent.model})` : 'Select Model'}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {Object.entries(MODEL_CATEGORIES).map(([category, models]) => (
                          <React.Fragment key={category}>
                            <Dropdown.Header>{category}</Dropdown.Header>
                            {models.map((model) => (
                              <Dropdown.Item
                                key={model}
                                onClick={() => onModelChange(model)}
                              >
                                {MODEL_LIST.find((m) => m.model === model).name}
                              </Dropdown.Item>
                            ))}
                          </React.Fragment>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>System Prompt</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={agent.systemPrompt}
                      onChange={onSystemPromptChange}
                      placeholder="Enter system prompt here..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Input Source</Form.Label>
                    <ButtonGroup>
                      <ToggleButton
                        key="user"
                        id={`radio-user-${agent.id}`}
                        type="radio"
                        variant="outline-primary"
                        name={`radio-${agent.id}`}
                        value="user"
                        checked={agent.sourceType === 'user'}
                        onChange={(e) => onSourceTypeChange(e)}
                      >
                        User
                      </ToggleButton>
                      <ToggleButton
                        key="left"
                        id={`radio-left-${agent.id}`}
                        type="radio"
                        variant="outline-primary"
                        name={`radio-${agent.id}`}
                        value="left"
                        checked={agent.sourceType === 'left'}
                        onChange={(e) => onSourceTypeChange(e)}
                      >
                        Left
                      </ToggleButton>
                    </ButtonGroup>
                  </Form.Group>
                </Form>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
}

export default AgentConfigAccordion;
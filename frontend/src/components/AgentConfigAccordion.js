import { Row, Container, Col, Card } from 'react-bootstrap';
import React from 'react';
import { Accordion, Form, Button, Dropdown } from 'react-bootstrap';
import { MODEL_CATEGORIES, MODEL_LIST } from '../constants';

function AgentConfigAccordion({ agent, onNameChange, onModelChange, systemPrompt, onSystemPromptChange, onSaveSystemPrompt, onAddAgent, onRemoveAgent, isOnlyAgent }) {
  return (
    <Container fluid className="px-0">
      <Row className="align-items-center">
        <Col>
          <Accordion className='agentconfig'>
            <Accordion.Item eventKey="0">
              <Accordion.Header>{agent.name}</Accordion.Header>
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
                      value={systemPrompt}
                      onChange={onSystemPromptChange}
                      placeholder="Enter system prompt here..."
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={onSaveSystemPrompt}>
                    Save Changes
                  </Button>
                </Form>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
        {/* <Col xs="auto" className="d-flex align-items-center">
          <Button variant="link" onClick={onAddAgent} className="p-0 me-2" title="Add Agent">
            <PlusCircle size={24} color="royalblue" />
          </Button>
          <Button variant="link" onClick={onRemoveAgent} className="p-0" disabled={isOnlyAgent} title="Remove Agent">
            <MinusCircle size={24} color={isOnlyAgent ? "gray" : "red"} />
          </Button>
        </Col> */}
      </Row>
    </Container>
  );
}

export default AgentConfigAccordion;
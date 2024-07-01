import React, { useState } from "react";
import { Row, Col, Form, Dropdown, ButtonGroup, ToggleButton, Button } from "react-bootstrap";
import { useDispatch, useSelector } from 'react-redux';
import { MODEL_CATEGORIES, MODEL_LIST } from "../constants";
import { saveAgentConfiguration, loadAgentConfiguration } from "../redux/actions";

function AgentConfigForm({
  agent,
  onNameChange,
  onModelChange,
  onSourceTypeChange,
  onSystemPromptChange,
}) {
  const dispatch = useDispatch();
  const [configName, setConfigName] = useState('');
  const savedAgentConfigurations = useSelector(state => state.agents.savedAgentConfigurations);

  const handleSaveConfiguration = () => {
    if (configName.trim() === '') {
      alert('Please enter a name for the configuration');
      return;
    }
    const configToSave = {
      name: agent.name,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      sourceType: agent.sourceType
    };
    dispatch(saveAgentConfiguration(configName, configToSave));
    setConfigName('');
    alert('Configuration saved successfully!');
  };

  const handleLoadConfiguration = (name) => {
    dispatch(loadAgentConfiguration(agent.id, name));
  };

  return (
    <Form>
      <Row className="align-items-start">
        <Col>
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={5}
              value={agent.systemPrompt}
              onChange={onSystemPromptChange}
              placeholder="Enter system prompt here..."
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-2">
            <Dropdown>
              <Dropdown.Toggle variant="primary" id="dropdown-model">
                {agent.model ? `(${agent.model})` : "Select Model"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.entries(MODEL_CATEGORIES).map(
                  ([category, models]) => (
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
                  )
                )}
              </Dropdown.Menu>
            </Dropdown>
          </Form.Group>
          <Form.Group className="mb-3">
            <ButtonGroup>
              <ToggleButton
                key="user"
                id={`radio-user-${agent.id}`}
                type="radio"
                variant="outline-primary"
                name={`radio-${agent.id}`}
                value="user"
                checked={agent.sourceType === "user"}
                onChange={onSourceTypeChange}
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
                checked={agent.sourceType === "left"}
                onChange={onSourceTypeChange}
              >
                Left
              </ToggleButton>
            </ButtonGroup>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Configuration name"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col>
          <Button onClick={handleSaveConfiguration}>Save Configuration</Button>
        </Col>
        <Col>
          <Dropdown>
            <Dropdown.Toggle variant="success">
              Load Configuration
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {savedAgentConfigurations && Object.keys(savedAgentConfigurations).length > 0 ? (
                Object.keys(savedAgentConfigurations)
                  .filter(name => name && savedAgentConfigurations[name] && savedAgentConfigurations[name].name)
                  .map((name) => (
                    <Dropdown.Item
                      key={name}
                      onClick={() => handleLoadConfiguration(name)}
                    >
                      {name}
                    </Dropdown.Item>
                  ))
              ) : (
                <Dropdown.Item disabled>No saved configurations</Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
    </Form>
  );
}

export default AgentConfigForm;

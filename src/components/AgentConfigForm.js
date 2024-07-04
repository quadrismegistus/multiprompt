import React, { useState, useEffect } from "react";
import { Row, Col, Form, Dropdown, Button } from "react-bootstrap";
import { MODEL_CATEGORIES, MODEL_LIST } from "../constants";
import useStore from '../store/useStore';

function AgentConfigForm({ agent }) {
  const [roleName, setRoleName] = useState(agent.name);
  
  const updateAgent = useStore(state => state.updateAgent);
  const saveAgentConfiguration = useStore(state => state.saveAgentConfiguration);
  const loadAgentConfiguration = useStore(state => state.loadAgentConfiguration);
  const savedAgentConfigurations = useStore(state => state.savedAgentConfigurations);
  const savedGlobalConfigurations = useStore(state => state.config.savedGlobalConfigurations || []);
  const loadConfiguration = useStore(state => state.loadConfiguration);

  useEffect(() => {
    setRoleName(agent.name);
  }, [agent.name]);

  const handleNameChange = (e) => {
    updateAgent(agent.id, { name: e.target.value });
  };

  const handleModelChange = (model) => {
    updateAgent(agent.id, { model });
  };

  const handleSystemPromptChange = (e) => {
    updateAgent(agent.id, { systemPrompt: e.target.value });
  };

  const handleTemperatureChange = (e) => {
    updateAgent(agent.id, { temperature: parseFloat(e.target.value) });
  };

  const handleSaveRole = () => {
    if (roleName.trim() === '') {
      return;
    }
    const roleToSave = {
      name: roleName,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
    };
    saveAgentConfiguration(roleName, roleToSave);
    handleNameChange({ target: { value: roleName } });
  };

  const handleLoadRole = (name) => {
    loadAgentConfiguration(agent.id, name);
  };

  const handleLoadGlobalConfiguration = (configuration) => {
    loadConfiguration(configuration);
  };

  return (
    <Form>
      <Row className="mb-3">
        <Col md={8}>
          <Form.Group>
            <Form.Label>Model</Form.Label>
            <Dropdown>
              <Dropdown.Toggle variant="primary" id="dropdown-model" className="w-100">
                {agent.model ? `(${agent.model})` : "Select Model"}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                {Object.entries(MODEL_CATEGORIES).map(
                  ([category, models]) => (
                    <React.Fragment key={category}>
                      <Dropdown.Header>{category}</Dropdown.Header>
                      {models.map((model) => (
                        <Dropdown.Item
                          key={model}
                          onClick={() => handleModelChange(model)}
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
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Temperature</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="1.5"
              step="0.1"
              value={agent.temperature}
              onChange={handleTemperatureChange}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
        <Form.Group>
        <Form.Label>Number of Previous Messages to Include</Form.Label>
        <Form.Control
          type="number"
          min="0"
          value={agent.numLastMessagesWanted}
          onChange={(e) => updateAgent(agent.id, { numLastMessagesWanted: parseInt(e.target.value) })}
        />
      </Form.Group>

        </Col>
        <Col>
          <Form.Group>
            <Form.Label>System Prompt</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={agent.systemPrompt}
              onChange={handleSystemPromptChange}
              placeholder="Enter system prompt here..."
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="align-items-center mb-3">
        <Col md={4}>
          <Dropdown>
            <Dropdown.Toggle variant="success" className="w-100">
              Load Role
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {savedAgentConfigurations && Object.keys(savedAgentConfigurations).length > 0 ? (
                Object.keys(savedAgentConfigurations)
                  .filter(name => name && savedAgentConfigurations[name] && savedAgentConfigurations[name].name)
                  .map((name) => (
                    <Dropdown.Item
                      key={name}
                      onClick={() => handleLoadRole(name)}
                    >
                      {name}
                    </Dropdown.Item>
                  ))
              ) : (
                <Dropdown.Item disabled>No saved roles</Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Role name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Button onClick={handleSaveRole} className="w-100">Save Role</Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Dropdown>
            <Dropdown.Toggle variant="info" id="dropdown-global-config" className="w-100">
              Load Global Configuration
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {Object.keys(savedGlobalConfigurations).length > 0 ? (
                Object.keys(savedGlobalConfigurations).map(name => (
                  <Dropdown.Item key={name} onClick={() => handleLoadGlobalConfiguration(name)}>
                    {name}
                  </Dropdown.Item>
                ))
              ) : (
                <Dropdown.Item disabled>No saved global configurations</Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
    </Form>
  );
}

export default AgentConfigForm;
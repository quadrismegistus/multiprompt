import React, { useState, useEffect } from "react";
import { Row, Col, Form, Dropdown, Button } from "react-bootstrap";
import { useDispatch, useSelector } from 'react-redux';
import { MODEL_CATEGORIES, MODEL_LIST } from "../constants";
import { saveAgentConfiguration, loadAgentConfiguration } from "../redux/actions";

function AgentConfigForm({
  agent,
  onNameChange,
  onModelChange,
  onSystemPromptChange,
  onTemperatureChange,
}) {
  const dispatch = useDispatch();
  const [roleName, setRoleName] = useState(agent.name);
  const savedAgentConfigurations = useSelector(state => state.agents.savedAgentConfigurations);

  useEffect(() => {
    setRoleName(agent.name);
  }, [agent.name]);

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
    dispatch(saveAgentConfiguration(roleName, roleToSave));
    onNameChange({ target: { value: roleName } });
  };

  const handleLoadRole = (name) => {
    dispatch(loadAgentConfiguration(agent.id, name));
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
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>System Prompt</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={agent.systemPrompt}
              onChange={onSystemPromptChange}
              placeholder="Enter system prompt here..."
            />
          </Form.Group>
        </Col>
      </Row>
      <Row className="align-items-center">
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
    </Form>
  );
}

export default AgentConfigForm;
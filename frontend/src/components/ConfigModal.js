import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Col } from 'react-bootstrap';
import { useConfig } from '../contexts/ConfigContext';

function ConfigModal({ show, onHide }) {
  const { config, updateConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState({ ...config });
  const summaryModels = ['Model 1', 'Model 2']; // Add actual summary models

  useEffect(() => {
    setLocalConfig({ ...config });
  }, [config]);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalConfig({
      ...localConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveConfig = () => {
    updateConfig(localConfig);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Include Repository Analysis"
              name="includeRepoAnalysis"
              checked={localConfig.includeRepoAnalysis}
              onChange={handleConfigChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Use Summary Model"
              name="summaryModel"
              checked={localConfig.summaryModel}
              onChange={handleConfigChange}
            />
          </Form.Group> */}
          {localConfig.summaryModel && (
            <Form.Group className="mb-3">
              <Form.Select
                name="summaryModelValue"
                value={localConfig.summaryModelValue}
                onChange={handleConfigChange}
              >
                {summaryModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>OpenAI API Key</Form.Label>
            <Form.Control
              type="password"
              name="openaiApiKey"
              value={localConfig.openaiApiKey || ''}
              onChange={handleConfigChange}
              placeholder="Enter OpenAI API Key"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Claude API Key</Form.Label>
            <Form.Control
              type="password"
              name="claudeApiKey"
              value={localConfig.claudeApiKey || ''}
              onChange={handleConfigChange}
              placeholder="Enter Claude API Key"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSaveConfig}>
          Save Config
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfigModal;
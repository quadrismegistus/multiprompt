import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import useStore from '../store/useStore';

function ConfigModal({ show, onHide }) {
  const { config, updateConfig } = useStore(state => ({
    config: state.config,
    updateConfig: state.updateConfig
  }));

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    updateConfig({ [name]: value });
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>OpenAI API Key</Form.Label>
            <Form.Control
              type="password"
              name="openaiApiKey"
              value={config.openaiApiKey || ''}
              onChange={handleConfigChange}
              placeholder="Enter OpenAI API Key"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Claude API Key</Form.Label>
            <Form.Control
              type="password"
              name="claudeApiKey"
              value={config.claudeApiKey || ''}
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
      </Modal.Footer>
    </Modal>
  );
}

export default ConfigModal;
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useConfig } from '../contexts/ConfigContext';
import { Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

function ConfigModal({ show, onHide }) {
  const { config, updateConfig, clearAgentCache } = useConfig();
  const [localConfig, setLocalConfig] = useState({ ...config });
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.config.isDarkMode);

  useEffect(() => {
    setLocalConfig({ ...config });
  }, [config]);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedConfig = {
      ...localConfig,
      [name]: type === 'checkbox' ? checked : value
    };
    setLocalConfig(updatedConfig);
    updateConfig(updatedConfig);
  };

  const handleClearAgentCache = () => {
    clearAgentCache();
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
    document.documentElement.classList.toggle('dark');
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
          <Form.Group className="mb-3">
            <Form.Label>Theme</Form.Label>
            <Button 
              variant="link" 
              onClick={toggleTheme} 
              className="d-block"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              {isDarkMode ? " Switch to Light Mode" : " Switch to Dark Mode"}
            </Button>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="danger" onClick={handleClearAgentCache}>
          Clear Agent Cache
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfigModal;
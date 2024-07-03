import React from 'react';
import { Form, Button } from 'react-bootstrap';
import { Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useConfig } from '../contexts/ConfigContext';

function SettingsForm() {
  const { config, updateConfig, clearAgentCache } = useConfig();
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.config.isDarkMode);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedConfig = {
      ...config,
      [name]: type === 'checkbox' ? checked : value
    };
    updateConfig(updatedConfig);
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
    document.documentElement.classList.toggle('dark');
  };

  const handleClearAgentCache = () => {
    clearAgentCache();
    // Optionally, you might want to add some feedback to the user here
    // For example, show a toast notification
  };

  return (
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
      {/* <Form.Group className="mb-3">
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
      <Button variant="danger" onClick={handleClearAgentCache}>
        Clear Agent Cache
      </Button> */}
    </Form>
  );
}

export default SettingsForm;
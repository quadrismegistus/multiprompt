import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button } from 'react-bootstrap';
import { saveConfiguration } from '../redux/actions';

const SaveConfigurationComponent = () => {
  const [configName, setConfigName] = useState('');
  const dispatch = useDispatch();
  const currentAgents = useSelector(state => state.agents.agents);

  const handleSave = () => {
    if (configName.trim() === '') {
      alert('Please enter a name for the configuration');
      return;
    }

    const configuration = {
      name: configName,
      agents: currentAgents
    };

    dispatch(saveConfiguration(configuration));
    setConfigName('');
    alert('Configuration saved successfully!');
  };

  return (
    <Form inline>
      <Form.Control
        type="text"
        placeholder="Enter configuration name"
        value={configName}
        onChange={(e) => setConfigName(e.target.value)}
        className="mr-2"
      />
      <Button onClick={handleSave}>Save Configuration</Button>
    </Form>
  );
};

export default SaveConfigurationComponent;
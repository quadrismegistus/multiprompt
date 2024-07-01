import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { loadConfiguration } from '../redux/actions';

const AgentDropdown = () => {
  const savedGlobalConfigurations = useSelector(state => state.config.savedGlobalConfigurations || []);
  const dispatch = useDispatch();

  const handleSelect = (configuration) => {
    dispatch(loadConfiguration(configuration));
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="success" id="dropdown-basic">
        Load Configuration
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {Object.keys(savedGlobalConfigurations).length > 0 ? (
          Object.keys(savedGlobalConfigurations).map(name => (
            <Dropdown.Item key={name} onClick={() => handleSelect(name)}>
              {name}
            </Dropdown.Item>
          ))
        ) : (
          <Dropdown.Item disabled>No saved configurations</Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default AgentDropdown;

// src/contexts/ConfigContext.js

import React, { createContext, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const config = useSelector(state => state.config);
  const dispatch = useDispatch();

  const updateConfig = (newConfig) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
  };

  const clearAgentCache = () => {
    dispatch({ type: 'CLEAR_AGENT_CACHE' });
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, clearAgentCache }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

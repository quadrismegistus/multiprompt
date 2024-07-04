import React, { createContext, useContext } from 'react';
import useStore from '../store/useStore';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const {
    config,
    updateConfig,
    clearAgentCache
  } = useStore();

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
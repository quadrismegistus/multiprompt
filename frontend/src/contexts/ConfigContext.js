import React, { createContext, useState, useContext, useEffect } from 'react';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    includeRepoAnalysis: true,
    summaryModel: false,
    summaryModelValue: '',
    openaiApiKey: '',
    claudeApiKey: ''
  });

  useEffect(() => {
    // Load config from localStorage on mount
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const updateConfig = (newConfig) => {
    setConfig(prevConfig => {
      const updatedConfig = { ...prevConfig, ...newConfig };
      // Save to localStorage whenever config is updated
      localStorage.setItem('appConfig', JSON.stringify(updatedConfig));
      return updatedConfig;
    });
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
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
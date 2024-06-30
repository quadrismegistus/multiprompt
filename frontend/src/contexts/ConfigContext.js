import React, { createContext, useContext, useState } from 'react';

export const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    includeRepoAnalysis: true,
    summaryModel: false,
    summaryModelValue: '',
  });

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
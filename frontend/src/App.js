import React from 'react';
import { AgentProvider } from './contexts/AgentContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LLMProvider } from './contexts/LLMProvider';
import Layout from './components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

function App() {
  return (
    <ConfigProvider>
      <AgentProvider>
        <LLMProvider>
          <Layout />
        </LLMProvider>
      </AgentProvider>
    </ConfigProvider>
  );
}

export default App;
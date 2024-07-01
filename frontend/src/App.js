import React from 'react';
import { AgentProvider } from './contexts/AgentContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LLMProvider } from './contexts/LLMProvider';
import Layout from './components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';
import { PromptProvider } from './contexts/PromptContext';

function App() {
  return (
    <ConfigProvider>
      <LLMProvider>
        <AgentProvider>
          <PromptProvider>
            <Layout />
          </PromptProvider>
        </AgentProvider>
      </LLMProvider>
    </ConfigProvider>
  );
}

export default App;
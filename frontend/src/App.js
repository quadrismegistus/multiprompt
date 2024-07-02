import React from 'react';
import { AgentProvider } from './contexts/AgentContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LLMProvider } from './contexts/LLMProvider';
import { DirectoryReaderProvider } from './contexts/DirectoryReaderContext';
import Layout from './components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

function App() {
  return (
    <ConfigProvider>
      <DirectoryReaderProvider>
        <AgentProvider>
          <LLMProvider>
            <Layout />
          </LLMProvider>
        </AgentProvider>
      </DirectoryReaderProvider>
    </ConfigProvider>
  );
}

export default App;
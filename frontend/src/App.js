// src/App.js
import React from 'react';
import { useSelector } from 'react-redux';
import { AgentProvider } from './contexts/AgentContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LLMProvider } from './contexts/LLMProvider';
import Layout from './components/Layout';
import AgentColumns from './components/AgentColumns';
import UserColumn from './components/UserColumn';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

function App() {
  const isDarkMode = useSelector(state => state.config.isDarkMode);

  return (
    <ConfigProvider>
      <LLMProvider>
        <AgentProvider>
          <Layout>
            <div className={`flex-container ${isDarkMode ? 'dark' : ''}`}>
              <UserColumn />
              <AgentColumns />
            </div>
          </Layout>
        </AgentProvider>
      </LLMProvider>
    </ConfigProvider>
  );
}

export default App;
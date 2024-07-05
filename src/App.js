import React from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LLMProvider } from './contexts/LLMProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { DirectoryReaderProvider } from './contexts/DirectoryReaderContext';
import ModalManager from './components/ModalManager';
import Layout from './components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

function App() {
  return (
    <ConfigProvider>
      <ThemeProvider>
        <SocketProvider>
          <DirectoryReaderProvider>
              <LLMProvider>
                <Layout />
                <ModalManager />
              </LLMProvider>
          </DirectoryReaderProvider>
      </SocketProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
}

export default App;
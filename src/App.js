import React from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { LLMProvider } from './contexts/LLMProvider';
import { DirectoryReaderProvider } from './contexts/DirectoryReaderContext';
import ModalManager from './components/ModalManager';
import Layout from './components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

function App() {
  return (
    <SocketProvider>
      <DirectoryReaderProvider>
          <LLMProvider>
            <Layout />
            <ModalManager />
          </LLMProvider>
      </DirectoryReaderProvider>
    </SocketProvider>
  );
}

export default App;
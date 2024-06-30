import React, { useState, useEffect } from 'react';
import 'bulma/css/bulma.min.css';
import './styles/index.css';
import { ConfigProvider } from './contexts/ConfigContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Header from './components/Header';
import Prompt from './components/Prompt';
import AgentColumns from './components/AgentColumns';
import ConfigModal from './components/ConfigModal';
import DirectoryReader from './components/DirectoryReader';
import { MODEL_CATEGORIES, MODEL_LIST, DEFAULT_MODELS, DEFAULT_MODEL } from './constants';

function App() {
  const models = {
    available: MODEL_CATEGORIES,
    list: MODEL_LIST,
    default: DEFAULT_MODELS,
    default_summary_model: DEFAULT_MODEL
  };

  const [agents, setAgents] = useState([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const saveToLocalStorage = (agents) => {
    localStorage.setItem('agentConfiguration', JSON.stringify(agents));
  };

  const loadFromLocalStorage = () => {
    const savedConfiguration = localStorage.getItem('agentConfiguration');
    return savedConfiguration ? JSON.parse(savedConfiguration) : null;
  };

  useEffect(() => {
    const savedAgents = loadFromLocalStorage();
    if (savedAgents && savedAgents.length > 0) {
      setAgents(savedAgents);
    } else if (DEFAULT_MODELS.length > 0) {
      const initialAgent = [{
        id: 1,
        name: 'Agent 1',
        model: DEFAULT_MODELS[0]
      }];
      setAgents(initialAgent);
      saveToLocalStorage(initialAgent);
    }
  }, []);

  const handleAddAgent = (afterId) => {
    setAgents(prevAgents => {
      const newIndex = prevAgents.findIndex(agent => agent.id === afterId) + 1;
      const newAgent = {
        id: Date.now(),
        name: `Agent ${prevAgents.length + 1}`,
        model: ''
      };
      const updatedAgents = [
        ...prevAgents.slice(0, newIndex),
        newAgent,
        ...prevAgents.slice(newIndex)
      ];
      saveToLocalStorage(updatedAgents);
      return updatedAgents;
    });
  };

  const handleRemoveAgent = (id) => {
    setAgents(prevAgents => {
      if (prevAgents.length <= 1) return prevAgents;
      const updatedAgents = prevAgents.filter(agent => agent.id !== id);
      saveToLocalStorage(updatedAgents);
      return updatedAgents;
    });
  };

  const handleUpdateAgent = (id, updates) => {
    setAgents(prevAgents => {
      const updatedAgents = prevAgents.map(agent =>
        agent.id === id ? { ...agent, ...updates } : agent
      );
      saveToLocalStorage(updatedAgents);
      return updatedAgents;
    });
  };
  





  const [referenceCodePrompt, setReferenceCodePrompt] = useState('');

  const handleReferenceCodePrompt = (markdownContent) => {
    setReferenceCodePrompt(markdownContent);
  };

  return (
    <ConfigProvider>
      <WebSocketProvider>
        <div className="container">
          <div id="content">
          <Header onConfigClick={() => setIsConfigModalOpen(true)} />
          <div className="columns is-multiline">
            <div className="column">
              <div className="box">
                <h3 className="title is-4">Prompt</h3>
                <DirectoryReader onMarkdownGenerated={handleReferenceCodePrompt} />
                <Prompt referenceCodePrompt={referenceCodePrompt} />
              </div>
            </div>
            <AgentColumns
              agents={agents}
              models={models}
              onAddAgent={handleAddAgent}
              onRemoveAgent={handleRemoveAgent}
              onUpdateAgent={handleUpdateAgent}
            />
          </div>
          </div>
          <ConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            agents={agents}
          />
        </div>
      </WebSocketProvider>
    </ConfigProvider>
  );
}

export default App;
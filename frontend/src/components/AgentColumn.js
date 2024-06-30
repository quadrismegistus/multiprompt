import React, { useState, useEffect, useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MODEL_CATEGORIES, MODEL_LIST } from '../constants';

function AgentColumn({ agent, onRemove, onAdd, isOnlyColumn, onUpdateAgent }) {
  const [output, setOutput] = useState('');
  const { lastMessage } = useContext(WebSocketContext);
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState(agent.systemPrompt || '');

  useEffect(() => {
    if (lastMessage && lastMessage.model === agent.model) {
      setOutput(prevOutput => prevOutput + lastMessage.text);
    }
  }, [lastMessage, agent.model]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    onUpdateAgent(agent.id, { name: newName });
  };

  const handleModelChange = (model) => {
    onUpdateAgent(agent.id, { model: model });
  };

  const handleSystemPromptChange = (e) => {
    setTempSystemPrompt(e.target.value);
  };

  const saveSystemPrompt = () => {
    onUpdateAgent(agent.id, { systemPrompt: tempSystemPrompt });
    setIsSystemPromptModalOpen(false);
  };

  return (
    <div className="box">
      <div className="columns is-mobile is-vcentered">
        <div className="column">
          <div className="field is-grouped">
            <div className="control is-expanded">
              <input
                className="input is-primary"
                type="text"
                value={agent.name}
                onChange={handleNameChange}
              />
            </div>
            <div className="control">
              <div className="dropdown is-right is-hoverable">
                <div className="dropdown-trigger">
                  <button
                    className="button is-primary"
                    aria-haspopup="true"
                    aria-controls="dropdown-menu"
                  >
                    <span>{agent.model ? `(${agent.model})` : ''}</span>
                    <span className="icon is-small">
                      <i className="fas fa-angle-down" aria-hidden="true"></i>
                    </span>
                  </button>
                </div>
                <div className="dropdown-menu" id="dropdown-menu" role="menu">
                  <div className="dropdown-content">
                    {Object.entries(MODEL_CATEGORIES).map(([category, models]) => (
                      <div key={category}>
                        <p className="dropdown-item is-active">{category}</p>
                        {models.map((model) => (
                          <a
                            key={model}
                            href="#"
                            className="dropdown-item"
                            onClick={() => handleModelChange(model)}
                          >
                            {MODEL_LIST.find((m) => m.model === model).name}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="column is-narrow">
          <button
            className="button is-small is-primary mr-2"
            onClick={onAdd}
          >
            <span className="icon is-small">
              <i className="fas fa-plus"></i>
            </span>
          </button>
          <button
            className="button is-small is-danger mr-2"
            onClick={onRemove}
            disabled={isOnlyColumn}
          >
            <span className="icon is-small">
              <i className="fas fa-minus"></i>
            </span>
          </button>
          <button
            className="button is-small is-info"
            onClick={() => setIsSystemPromptModalOpen(true)}
          >
            <span className="icon is-small">
              <i className="fas fa-cog"></i>
            </span>
          </button>
        </div>
      </div>
      <div className="content mt-3">
        <ReactMarkdown
          components={{
            code({node, inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {output}
        </ReactMarkdown>
      </div>
      
      {isSystemPromptModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={() => setIsSystemPromptModalOpen(false)}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">System Prompt for {agent.name}</p>
              <button className="delete" aria-label="close" onClick={() => setIsSystemPromptModalOpen(false)}></button>
            </header>
            <section className="modal-card-body">
              <textarea
                className="textarea"
                value={tempSystemPrompt}
                onChange={handleSystemPromptChange}
                placeholder="Enter system prompt here..."
                rows="10"
              />
            </section>
            <footer className="modal-card-foot">
              <button className="button is-success" onClick={saveSystemPrompt}>Save changes</button>
              <button className="button" onClick={() => setIsSystemPromptModalOpen(false)}>Cancel</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentColumn;
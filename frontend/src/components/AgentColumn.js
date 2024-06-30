import React, { useState } from 'react';
import { Card, Form, Button, Dropdown, Modal } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAgents } from '../contexts/AgentContext';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import { MODEL_CATEGORIES, MODEL_LIST } from '../constants';

function AgentColumn({ agent, onRemove, onAdd, isOnlyColumn }) {
  const { updateAgent } = useAgents();
  const { output, interact } = useAgentInteraction(agent);
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState(agent.systemPrompt || '');

  const handleNameChange = (e) => {
    const newName = e.target.value;
    updateAgent(agent.id, { name: newName });
  };

  const handleModelChange = (model) => {
    updateAgent(agent.id, { model: model });
  };

  const handleSystemPromptChange = (e) => {
    setTempSystemPrompt(e.target.value);
  };

  const saveSystemPrompt = () => {
    updateAgent(agent.id, { systemPrompt: tempSystemPrompt });
    setIsSystemPromptModalOpen(false);
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group className="mb-3 d-flex align-items-center">
          <Form.Control
            type="text"
            value={agent.name}
            onChange={handleNameChange}
            className="me-2"
          />
          <Dropdown>
            <Dropdown.Toggle variant="primary" id="dropdown-model">
              {agent.model ? `(${agent.model})` : 'Select Model'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.entries(MODEL_CATEGORIES).map(([category, models]) => (
                <React.Fragment key={category}>
                  <Dropdown.Header>{category}</Dropdown.Header>
                  {models.map((model) => (
                    <Dropdown.Item
                      key={model}
                      onClick={() => handleModelChange(model)}
                    >
                      {MODEL_LIST.find((m) => m.model === model).name}
                    </Dropdown.Item>
                  ))}
                </React.Fragment>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="primary" className="ms-2" onClick={onAdd}>
            +
          </Button>
          <Button variant="danger" className="ms-2" onClick={onRemove} disabled={isOnlyColumn}>
            -
          </Button>
          <Button variant="info" className="ms-2" onClick={() => setIsSystemPromptModalOpen(true)}>
            <i className="fas fa-cog"></i>
          </Button>
        </Form.Group>
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
      </Card.Body>
      
      <Modal show={isSystemPromptModalOpen} onHide={() => setIsSystemPromptModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>System Prompt for {agent.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            as="textarea"
            value={tempSystemPrompt}
            onChange={handleSystemPromptChange}
            placeholder="Enter system prompt here..."
            rows={10}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsSystemPromptModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveSystemPrompt}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default AgentColumn;
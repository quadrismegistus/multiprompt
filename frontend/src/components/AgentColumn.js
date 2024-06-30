import { PlusCircle, MinusCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Accordion, Form, Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import { Row, Container, Col, Card } from 'react-bootstrap';
import { useAgents } from '../contexts/AgentContext';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import MarkdownRenderer from './MarkdownRenderer';
import AgentConfigAccordion from './AgentConfigAccordion';

function AgentColumn({ agent, onRemove, onAdd, isOnlyColumn }) {
  const { updateAgent } = useAgents();
  const { output, interact } = useAgentInteraction(agent);
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
  };

  return (
    <Col className='agent-col useragent-col'>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-start">
          <AgentConfigAccordion
            agent={agent}
            onNameChange={handleNameChange}
            onModelChange={handleModelChange}
            systemPrompt={tempSystemPrompt}
            onSystemPromptChange={handleSystemPromptChange}
            onSaveSystemPrompt={saveSystemPrompt}
            onAddAgent={onAdd}
            onRemoveAgent={onRemove}
            isOnlyAgent={isOnlyColumn}
          />
          {/* <div className='agentconfig-buttons'>
            <Button variant="link" onClick={onAdd} className="me-2 p-0" title="Add Agent">
              <PlusCircle size={24} color="royalblue" />
            </Button>
            <Button variant="link" onClick={onRemove} className="p-0" disabled={isOnlyColumn} title="Remove Agent">
              <MinusCircle size={24} color={isOnlyColumn ? "gray" : "red"} />
            </Button>
          </div> */}
          <ButtonGroup vertical>
            <Button variant="link" onClick={onAdd} className="p-0 me-2" title="Add Agent">
              <PlusCircle size={24} color="royalblue" />
            </Button>
            <Button variant="link" onClick={onRemove} className="p-0" disabled={isOnlyColumn} title="Remove Agent">
              <MinusCircle size={24} color={isOnlyColumn ? "gray" : "red"} />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body>
          <MarkdownRenderer content={output} />
        </Card.Body>
      </Card>
    </Col>
  );
}

export default AgentColumn;
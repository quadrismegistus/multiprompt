import React from 'react';
import { Accordion, Form, Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import { Row, Container, Col, Card } from 'react-bootstrap';
import { useAgents } from '../contexts/AgentContext';
import MarkdownRenderer from './MarkdownRenderer';
import AgentConfigAccordion from './AgentConfigAccordion';
import { PlusCircle, MinusCircle } from 'lucide-react';

function AgentColumn({ agent, onRemove, onAdd, isOnlyColumn }) {
  const { updateAgent } = useAgents();

  const handleNameChange = (e) => {
    const newName = e.target.value;
    updateAgent(agent.id, { name: newName });
  };

  const handleModelChange = (model) => {
    updateAgent(agent.id, { model: model });
  };

  const handleSystemPromptChange = (e) => {
    updateAgent(agent.id, { systemPrompt: e.target.value });
  };

  return (
    <Col className='agent-col useragent-col'>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-start">
          <AgentConfigAccordion
            agent={agent}
            onNameChange={handleNameChange}
            onModelChange={handleModelChange}
            systemPrompt={agent.systemPrompt}
            onSystemPromptChange={handleSystemPromptChange}
          />
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
          <MarkdownRenderer content={agent.output} />
        </Card.Body>
      </Card>
    </Col>
  );
}


export default AgentColumn;
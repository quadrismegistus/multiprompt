import React from 'react';
import { Accordion, Form, Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import { Row, Container, Col, Card } from 'react-bootstrap';
import { useAgents } from '../contexts/AgentContext';
import MarkdownRenderer from './MarkdownRenderer';
import AgentConfigAccordion from './AgentConfigAccordion';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { updateAgent } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';

function AgentColumn({ agent, onRemove, onAdd, isOnlyColumn }) {
  const dispatch = useDispatch();

  const handleNameChange = (e) => {
    dispatch(updateAgent(agent.id, { name: e.target.value }));
  };

  const handleModelChange = (model) => {
    dispatch(updateAgent(agent.id, { model }));
  };

  const handleSystemPromptChange = (e) => {
    dispatch(updateAgent(agent.id, { systemPrompt: e.target.value }));
  };

  const handleSourceTypeChange = (e) => {
    dispatch(updateAgent(agent.id, { sourceType: e.target.value }));
  };

  return (
    <Col className='agent-col useragent-col'>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-start">
          <AgentConfigAccordion
            agent={agent}
            onNameChange={handleNameChange}
            onModelChange={handleModelChange}
            onSourceTypeChange={handleSourceTypeChange}
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
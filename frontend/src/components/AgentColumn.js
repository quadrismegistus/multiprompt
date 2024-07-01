import React from 'react';
import { Card, ButtonGroup, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { PlusCircle, MinusCircle } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import AgentConfigAccordion from './AgentConfigAccordion';
import { updateAgent } from '../redux/actions';
import AgentConfigForm from './AgentConfigForm';

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

  const handleTemperatureChange = (temperature) => {
    dispatch(updateAgent(agent.id, { temperature }));
  };

  return (
    <div className="agent-col useragent-col flex-grow">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <AgentConfigAccordion
            agent={agent}
            onNameChange={handleNameChange}
            onModelChange={handleModelChange}
            onSystemPromptChange={handleSystemPromptChange}
            onTemperatureChange={handleTemperatureChange}
          />
          <ButtonGroup>
            <Button variant="link" onClick={onAdd} className="p-0 mx-1" title="Add Agent">
              <PlusCircle size={24} />
            </Button>
            <Button variant="link" onClick={onRemove} className="p-0 mx-1" disabled={isOnlyColumn} title="Remove Agent">
              <MinusCircle size={24} className={isOnlyColumn ? "text-gray-400" : "text-red-500"} />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body className="overflow-y-auto">
          <MarkdownRenderer content={agent.output} />
        </Card.Body>
      </Card>
    </div>
  );
}

export default AgentColumn;
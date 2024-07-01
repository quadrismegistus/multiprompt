import React from 'react';
import { Card, ButtonGroup, Button } from 'react-bootstrap';
import { PlusCircle, MinusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import MarkdownRenderer from './MarkdownRenderer';
import AgentConfigAccordion from './AgentConfigAccordion';
import { moveAgentLeft, moveAgentRight } from '../redux/actions';

function AgentColumn({ agent, onRemove, onAdd, isOnlyColumn, onUpdateAgent }) {
  const dispatch = useDispatch();

  const handleNameChange = (e) => {
    onUpdateAgent({ name: e.target.value });
  };

  const handleModelChange = (model) => {
    onUpdateAgent({ model });
  };

  const handleSystemPromptChange = (e) => {
    onUpdateAgent({ systemPrompt: e.target.value });
  };

  const handleTemperatureChange = (temperature) => {
    onUpdateAgent({ temperature });
  };

  const handleMoveLeft = () => {
    dispatch(moveAgentLeft(agent.id));
  };

  const handleMoveRight = () => {
    dispatch(moveAgentRight(agent.id));
  };

  return (
    <Card className={`agent-card useragent-card flex-grow`}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <AgentConfigAccordion
          agent={agent}
          onNameChange={handleNameChange}
          onModelChange={handleModelChange}
          onSystemPromptChange={handleSystemPromptChange}
          onTemperatureChange={handleTemperatureChange}
        />
        <ButtonGroup>
          <Button variant="link" onClick={handleMoveLeft} className="p-0 mx-1" title="Move Left">
            <ChevronLeft size={24} />
          </Button>
          <Button variant="link" onClick={handleMoveRight} className="p-0 mx-1" title="Move Right">
            <ChevronRight size={24} />
          </Button>
          <Button variant="link" onClick={() => onAdd(agent.position + 1)} className="p-0 mx-1" title="Add Agent">
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
  );
}

export default AgentColumn;
import React from 'react';
import { Card, ButtonGroup, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { PlusCircle, MinusCircle } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import AgentConfigAccordion from './AgentConfigAccordion';
import { updateAgent } from '../redux/actions';

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
    <div className="agent-col useragent-col flex-grow">
      <Card>
        <Card.Header>
          <ButtonGroup vertical className='pl-3 m-0'>
            <Button variant="link" onClick={onAdd} className="p-0 mb-2" title="Add Agent">
              <PlusCircle size={24} />
            </Button>
            <Button variant="link" onClick={onRemove} className="p-0" disabled={isOnlyColumn} title="Remove Agent">
              <MinusCircle size={24} className={isOnlyColumn ? "text-gray-400" : "text-red-500"} />
            </Button>
          </ButtonGroup>
          <AgentConfigAccordion
            agent={agent}
            onNameChange={handleNameChange}
            onModelChange={handleModelChange}
            onSourceTypeChange={handleSourceTypeChange}
            onSystemPromptChange={handleSystemPromptChange}
          />
        </Card.Header>
        <Card.Body className="overflow-y-auto">
          <MarkdownRenderer content={agent.output} />
        </Card.Body>
      </Card>
    </div>
  );
}

export default AgentColumn;
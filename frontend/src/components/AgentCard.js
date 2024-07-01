import React from 'react';
import { Card, ButtonGroup, Button } from 'react-bootstrap';
import { PlusCircle, MinusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import AgentConfigAccordion from './AgentConfigAccordion';
import { useAgents } from '../contexts/AgentContext';

function AgentCard({ agent }) {
  const { agents, addAgent, removeAgent, updateAgent, moveAgentTo } = useAgents();

  const isOnlyColumn = agents.filter(a => a.type === 'ai').length === 1;

  const handleNameChange = (e) => {
    updateAgent(agent.id, { name: e.target.value });
  };

  const handleModelChange = (model) => {
    updateAgent(agent.id, { model });
  };

  const handleSystemPromptChange = (e) => {
    updateAgent(agent.id, { systemPrompt: e.target.value });
  };

  const handleTemperatureChange = (temperature) => {
    updateAgent(agent.id, { temperature });
  };

  const handleMoveAgentLeft = () => {
    moveAgentTo(agent.id, agent.position - 1);
  };

  const handleMoveAgentRight = () => {
    moveAgentTo(agent.id, agent.position + 1);
  };

  const handleAddAgent = () => {
    addAgent(agent.position);
  };

  const handleRemoveAgent = () => {
    removeAgent(agent.id);
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
          <Button variant="link" onClick={handleMoveAgentLeft} className="p-0 mx-1" title="Move Left">
            <ChevronLeft size={24} />
          </Button>
          <Button variant="link" onClick={handleMoveAgentRight} className="p-0 mx-1" title="Move Right">
            <ChevronRight size={24} />
          </Button>
          <Button variant="link" onClick={handleAddAgent} className="p-0 mx-1" title="Add Agent">
            <PlusCircle size={24} />
          </Button>
          <Button variant="link" onClick={handleRemoveAgent} className="p-0 mx-1" disabled={isOnlyColumn} title="Remove Agent">
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

export default AgentCard;
import React, { useRef, useEffect } from 'react';
import { Card, ButtonGroup, Button, ProgressBar } from 'react-bootstrap'; 
import { PlusCircle, MinusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import useStore from '../store/useStore';
import { Row, Container, Col, Accordion } from 'react-bootstrap';
import AgentConfigForm from './AgentConfigForm';
import { MODEL_DICT_r } from '../constants';
import { getCostPerToken } from '../utils/promptUtils';

function AgentCard({ agent }) {
  const updateAgent = useStore((state) => state.updateAgent);
  const addAgent = useStore((state) => state.addAgent);
  const removeAgent = useStore((state) => state.removeAgent);
  const moveAgentTo = useStore((state) => state.moveAgentTo);
  const agents = useStore((state) => state.agents);
  const agentProgress = useStore((state) => state.agents.find(a => a.id === agent.id)?.progress || 0);
  const agentProgressTokens = useStore((state) => state.agents.find(a => a.id === agent.id)?.progressTokens || 0);

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

  const cardBodyRef = useRef(null);
  useEffect(() => {
    if (cardBodyRef.current) {
      cardBodyRef.current.scrollTop = cardBodyRef.current.scrollHeight;
    }
  }, [agent.output]);

  return (
    <Card className={`agent-card useragent-card flex-grow`}>
      <Card.Header className="d-flex justify-content-between align-items-start">
        <Accordion className='agentconfig'>
            <Accordion.Item eventKey="0">
              <Accordion.Header>
               [{agent.position}] {agent.name}
                <span style={{
                  fontFamily: "monospace", 
                  fontSize: ".8em", 
                  lineHeight: 'normal',
                  fontStyle: "italic",
                  marginLeft: ".5em",
                }}>
                  ({MODEL_DICT_r[agent.model]})
                </span>
              </Accordion.Header>
              <Accordion.Body>
                <AgentConfigForm agent={agent} />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

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
      <Card.Body ref={cardBodyRef}>
        <MarkdownRenderer content={agent.output} />
      </Card.Body>
      <Card.Footer>
        {/* {agentProgress < 100 &&  */}
        <ProgressBar now={agentProgress} label={`${agentProgressTokens} tokens returned`} />
        {/* } */}
      </Card.Footer>
    </Card>
  );
}

export default AgentCard;
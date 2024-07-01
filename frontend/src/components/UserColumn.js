// src/components/UserColumn.js

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApiClients } from '../contexts/LLMProvider';
import { Card, Form, Button, Col, Accordion, ButtonGroup } from 'react-bootstrap';
import { Send } from 'lucide-react';
import { useAgents } from '../contexts/AgentContext';
import DirectoryReader from './DirectoryReader';
import MarkdownRenderer from './MarkdownRenderer';
import { updateReferenceCodePrompt, updateUserPrompt } from '../redux/actions';
import { formatPromptMessages } from '../utils/promptUtils';

function UserColumn() {
  const { agents, updateAgent } = useAgents();
  const { query } = useApiClients();
  const userAgent = agents.find(agent => agent.type === 'user');
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt); // Get from Redux state
  const [promptText, setPromptText] = useState(userPrompt); // Initialize with Redux state
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);
  const dispatch = useDispatch();

  const handleReferenceCodePromptChange = (e) => {
    dispatch(updateReferenceCodePrompt(e.target.value));
  };

  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
    dispatch(updateUserPrompt(e.target.value)); // Update Redux state
  };

  const handleDirectoryRead = (markdown) => {
    dispatch(updateReferenceCodePrompt(markdown));
  };

  const handleSendPrompt = async () => {
    const aiAgents = agents.filter(agent => agent.type === 'ai');
    let prevOutput = "";

    for (const agent of aiAgents) {
      const formattedPrompt = formatPromptMessages(promptText, referenceCodePrompt, prevOutput, agent.sourceType);

      const userMessage = {
        role: 'user',
        content: formattedPrompt,
      };

      const systemMessage = agent.systemPrompt
        ? { role: 'system', content: agent.systemPrompt }
        : { role: 'system', content: 'You are a helpful assistant.' };

      const messages = [systemMessage, userMessage];

      try {
        let responseContent = '';
        for await (const chunk of query(agent.model, messages)) {
          responseContent += chunk;
          updateAgent(agent.id, { output: responseContent + '█' });
        }
        updateAgent(agent.id, { output: responseContent });

        prevOutput = responseContent;
      } catch (error) {
        updateAgent(agent.id, { output: `Error: ${error.message}` });
      }
    }

    setIsEditing(false);
  };

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <Col className='user-col useragent-col'>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-start">
          <Accordion className='agentconfig flex-grow-1'>
            <Accordion.Item eventKey="0">
              <Accordion.Header>User</Accordion.Header>
              <Accordion.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Reference Code Prompt</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={referenceCodePrompt}
                      onChange={handleReferenceCodePromptChange}
                      placeholder="Enter reference code prompt here..."
                    />
                  </Form.Group>
                </Form>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
          <ButtonGroup>
            <Button variant="link" onClick={handleSendPrompt} className="p-0 ms-2" title="Send Prompt">
              <Send size={28} color="royalblue" />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body className='promptarea-card-body'>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className='promptarea w-100 h-100'
              value={promptText}
              onChange={handlePromptChange}
              placeholder="Enter your prompt here..."
              onBlur={() => setIsEditing(false)}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className='promptarea w-100 h-100'
              style={{ cursor: 'text' }}
            >
              <MarkdownRenderer content={promptText || "Click to edit prompt..."} />
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
}

export default UserColumn;
// src/components/UserColumn.js

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApiClients } from '../contexts/LLMProvider';
import { Card, Form, Button, Col, Accordion, ButtonGroup } from 'react-bootstrap';
import { Send } from 'lucide-react';
import { useAgents } from '../contexts/AgentContext';
import DirectoryReader from './DirectoryReader';
import MarkdownRenderer from './MarkdownRenderer';
import { updateReferenceCodePrompt } from '../redux/actions';
import { formatPromptMessages } from '../utils/promptUtils';

function UserColumn() {
  const { agents, updateAgent } = useAgents();
  const { query } = useApiClients();
  const userAgent = agents.find(agent => agent.type === 'user');
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const [promptText, setPromptText] = useState('');
  const [output, setOutput] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const editableDivRef = useRef(null);
  const dispatch = useDispatch();

  const handleReferenceCodePromptChange = (e) => {
    dispatch(updateReferenceCodePrompt(e.target.value));
  };

  const handlePromptChange = () => {
    if (editableDivRef.current) {
      setPromptText(editableDivRef.current.innerText);
    }
  };

  const handleDirectoryRead = (markdown) => {
    dispatch(updateReferenceCodePrompt(markdown));
  };

  const handleSendPrompt = async () => {
    const aiAgents = agents.filter(agent => agent.type === 'ai');
    let prevOutput = "";

    for (const [index, agent] of aiAgents.entries()) {
      const formattedPrompt = formatPromptMessages(promptText, referenceCodePrompt, prevOutput, agent.sourceType);

      const userMessage = {
        role: 'user',
        content: formattedPrompt
      };

      const systemMessage = agent.systemPrompt 
        ? { role: 'system', content: agent.systemPrompt }
        : { role: 'system', content: 'You are a helpful assistant.' };

      const messages = [systemMessage, userMessage];
      console.log('MESSAGES',messages);

      try {
        let responseContent = '';
        for await (const chunk of query(agent.model, messages)) {
          responseContent += chunk;
          updateAgent(agent.id, { output: responseContent });
        }
        prevOutput = responseContent;
      } catch (error) {
        updateAgent(agent.id, { output: `Error: ${error.message}` });
      }
    }
    
    setIsEditing(false);
  };

  useEffect(() => {
    if (editableDivRef.current) {
      editableDivRef.current.focus();
      const handleFocusOut = () => setIsEditing(false);
      const handleFocusIn = () => setIsEditing(true);
      editableDivRef.current.addEventListener('blur', handleFocusOut);
      editableDivRef.current.addEventListener('focus', handleFocusIn);

      return () => {
        editableDivRef.current.removeEventListener('blur', handleFocusOut);
        editableDivRef.current.removeEventListener('focus', handleFocusIn);
      };
    }
  }, []);

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
        <Card.Body>
          <div style={{ display: isEditing ? 'block' : 'none', height:'100%' }}>
            <div
              ref={editableDivRef}
              contentEditable
              onInput={handlePromptChange}
              className='promptarea'
              placeholder="Enter your prompt here..."
            />
          </div>
          <div style={{ display: isEditing ? 'none' : 'block', height:'100%' }}>
            <div 
              onClick={() => setIsEditing(true)}
              className='promptarea'
              style={{ cursor: 'text' }}
            >
              <MarkdownRenderer content={promptText || "Enter your prompt here..."} />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

export default UserColumn;
import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Col, Accordion, ButtonGroup } from 'react-bootstrap';
import { Send } from 'lucide-react';
import { useAgents } from '../contexts/AgentContext';
import DirectoryReader from './DirectoryReader';
import MarkdownRenderer from './MarkdownRenderer';
import { useApiClients } from '../contexts/LLMProvider';
import { useDispatch, useSelector } from 'react-redux';
import { updateReferenceCodePrompt } from '../redux/actions'; // Import the action

function UserColumn() {
  const { agents, updateAgent } = useAgents();
  const { query } = useApiClients();
  const userAgent = agents.find(agent => agent.type === 'user');
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt); // Get referenceCodePrompt from the Redux state
  const [promptText, setPromptText] = useState('');
  const [output, setOutput] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const editableDivRef = useRef(null);
  const dispatch = useDispatch(); // Get dispatch function

  const handleReferenceCodePromptChange = (e) => {
    dispatch(updateReferenceCodePrompt(e.target.value)); // Dispatch the action
  };

  const handlePromptChange = () => {
    if (editableDivRef.current) {
      setPromptText(editableDivRef.current.innerText);
    }
  };

  const handleDirectoryRead = (markdown) => {
    dispatch(updateReferenceCodePrompt(markdown)); // Dispatch the action
  };

  const handleSendPrompt = async () => {
    const userMessage = {
      role: 'user',
      content: promptText + (referenceCodePrompt ? '\n\nReference Code:\n' + referenceCodePrompt : '')
    };

    const aiAgents = agents.filter(agent => agent.type === 'ai');

    for (const agent of aiAgents) {
      const systemMessage = agent.systemPrompt 
        ? { role: 'system', content: agent.systemPrompt }
        : { role: 'system', content: 'You are a helpful assistant.' };

      const messages = [systemMessage, userMessage];

      try {
        let responseContent = '';
        for await (const chunk of query(agent.model, messages)) {
          responseContent += chunk;
          updateAgent(agent.id, { output: responseContent });
        }
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

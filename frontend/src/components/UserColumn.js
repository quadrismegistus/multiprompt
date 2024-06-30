import React, { useState } from 'react';
import { Card, Form, Button, Col, Accordion, ButtonGroup } from 'react-bootstrap';
import { Send } from 'lucide-react';
import { useAgents } from '../contexts/AgentContext';
import Prompt from './Prompt';
import DirectoryReader from './DirectoryReader';
import MarkdownRenderer from './MarkdownRenderer';

function UserColumn() {
  const { agents, updateAgent } = useAgents();
  const userAgent = agents.find(agent => agent.type === 'user');
  const [referenceCodePrompt, setReferenceCodePrompt] = useState('');
  const [promptText, setPromptText] = useState('');
  const [output, setOutput] = useState('');

  const handleNameChange = (e) => {
    const newName = e.target.value;
    updateAgent(userAgent.id, { name: newName });
  };

  const handleReferenceCodePromptChange = (e) => {
    setReferenceCodePrompt(e.target.value);
  };

  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
  };

  const handleSaveChanges = () => {
    updateAgent(userAgent.id, { referenceCodePrompt });
  };

  const handleDirectoryRead = (markdown) => {
    setReferenceCodePrompt(markdown);
  };

  const handleSendPrompt = () => {
    // This function should be implemented to handle sending the prompt
    // It should use the promptText and referenceCodePrompt
    console.log("Sending prompt:", promptText, "with reference code:", referenceCodePrompt);
    // After sending, you might want to clear the prompt text
    setPromptText('');
  };

  return (
    <Col className='user-col useragent-col'>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-start">
          <Accordion className='agentconfig flex-grow-1'>
            <Accordion.Item eventKey="0">
              <Accordion.Header>{userAgent.name}</Accordion.Header>
              <Accordion.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>User Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={userAgent.name}
                      onChange={handleNameChange}
                    />
                  </Form.Group>
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
                  <DirectoryReader onMarkdownGenerated={handleDirectoryRead} />
                  <Button variant="primary" onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
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
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              value={promptText}
              onChange={handlePromptChange}
              placeholder="Enter your prompt here..."
            />
          </Form.Group>
          <MarkdownRenderer content={output} />
        </Card.Body>
      </Card>
    </Col>
  );
}

export default UserColumn;
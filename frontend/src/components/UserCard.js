// src/components/UserCard.js
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Button, Col, Row, Accordion } from 'react-bootstrap';
import { updateReferenceCodePrompt, updateUserPrompt } from '../redux/actions';
import { formatPromptMessages } from '../utils/promptUtils';
import UserConfigForm from './UserConfigForm';
import SaveConfigurationComponent from './SaveConfigurationComponent';
import AgentDropdown from './AgentDropdown';
import { Send } from 'lucide-react';
import DirectoryReader from './DirectoryReader';
import MarkdownRenderer from './MarkdownRenderer';
import { usePrompt } from '../contexts/PromptContext';

function UserCard() {
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt);
  const [promptText, setPromptText] = useState(userPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);
  const dispatch = useDispatch();
  const { handleSendPrompt } = usePrompt();

  const handleReferenceCodePromptChange = (e) => {
    dispatch(updateReferenceCodePrompt(e.target.value));
  };

  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
    dispatch(updateUserPrompt(e.target.value));
  };

  const handleDirectoryRead = (markdown) => {
    dispatch(updateReferenceCodePrompt(markdown));
  };

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <Accordion className='agentconfig'>
          <Accordion.Item eventKey="0">
            <Accordion.Header>multiprompt</Accordion.Header>
            <Accordion.Body>
              <UserConfigForm />
              <Row className="mt-3">
                <Col>
                  <SaveConfigurationComponent />
                </Col>
                <Col>
                  <AgentDropdown />
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        <Button variant="link" onClick={handleSendPrompt} className="p-0" title="Send Prompt">
          <Send size={24} color="royalblue" />
        </Button>
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
      <Card.Footer>
        <Accordion>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Prompt appendix</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={referenceCodePrompt}
                  onChange={handleReferenceCodePromptChange}
                  placeholder="Enter reference code prompt here..."
                />
              </Form.Group>
              <DirectoryReader onMarkdownGenerated={handleDirectoryRead} />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Footer>
    </Card>
  );
}

export default UserCard;
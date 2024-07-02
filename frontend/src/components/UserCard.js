import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Button, Accordion, Row, Col, ButtonGroup } from 'react-bootstrap';
import { updateReferenceCodePrompt, updateUserPrompt, updateConfig } from '../redux/actions';
import DirectoryReader from './DirectoryReader';
import MarkdownRenderer from './MarkdownRenderer';
import { useLLM } from '../contexts/LLMProvider';

function UserCard() {
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt);
  const useFileInput = useSelector(state => state.config.useFileInput);
  const [promptText, setPromptText] = useState(userPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);
  const dispatch = useDispatch();
  const { handleSendPrompt } = useLLM();
  const directoryReaderRef = useRef(null);

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

  const handleUseFileInputToggle = (e) => {
    dispatch(updateConfig({ useFileInput: e.target.checked }));
  };

  const handleSend = useCallback(async () => {
    let updatedReferenceCodePrompt = referenceCodePrompt;
    if (useFileInput && directoryReaderRef.current && directoryReaderRef.current.readFileOrDirectory) {
      const updatedMarkdown = await directoryReaderRef.current.readFileOrDirectory();
      if (updatedMarkdown) {
        updatedReferenceCodePrompt = updatedMarkdown;
        dispatch(updateReferenceCodePrompt(updatedMarkdown));
      }
    }
    
    handleSendPrompt(promptText, updatedReferenceCodePrompt);
  }, [handleSendPrompt, dispatch, promptText, referenceCodePrompt, useFileInput]);

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-start">
        <Accordion className='agentconfig'>
          <Accordion.Item eventKey="0">
            <Accordion.Header>multiprompt</Accordion.Header>
            <Accordion.Body>
            <Form.Group className="mb-3">

              <Row>
                <Form.Label htmlFor="custom-switch">Prompt appendix (reference code or docs to send to LLM)</Form.Label>

                <Col md={6}>
                  <Button
                    variant={useFileInput ? "primary" : "secondary"}
                    onClick={() => handleUseFileInputToggle({ target: { checked: true } })}
                    className="w-100 mb-2"
                  >
                    File Input
                  </Button>
                  {/* <Form.Check 
                    type="switch"
                    id="custom-switch"
                    label="Use file/folder input"
                    checked={useFileInput}
                    onChange={handleUseFileInputToggle}
                    className="mb-2"
                  /> */}
                  <DirectoryReader ref={directoryReaderRef} onMarkdownGenerated={handleDirectoryRead} disabled={!useFileInput} />
                </Col>

                <Col md={6}>
                <Button
                    variant={useFileInput ? "secondary" : "primary"}
                    onClick={() => handleUseFileInputToggle({ target: { checked: false } })}
                    className="w-100"
                  >
                    Manual Input
                  </Button>
                  {/* <Form.Label htmlFor="referenceCodePromptTextarea">
                    Manual entry
                  </Form.Label> */}
                  <Form.Control
                    as="textarea"
                    id="referenceCodePromptTextarea"
                    rows={5}
                    value={referenceCodePrompt}
                    onChange={handleReferenceCodePromptChange}
                    placeholder="Enter reference code prompt here..."
                    disabled={useFileInput}
                    className="mt-2"
                  />
                </Col>

                

              </Row>
            </Form.Group>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        <Button variant="link" onClick={handleSend} className="p-0" title="Send Prompt">
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
    </Card>
  );
}

export default UserCard;
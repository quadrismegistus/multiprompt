import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Button, Accordion } from 'react-bootstrap';
import { updateUserPrompt } from '../redux/actions';
import MarkdownRenderer from './MarkdownRenderer';
import { useLLM } from '../contexts/LLMProvider';
import PromptAppendix from './PromptAppendix';
import { useDirectoryReader } from '../contexts/DirectoryReaderContext';

function UserCard() {
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const userPrompt = useSelector(state => state.config.userPrompt);
  const useFileInput = useSelector(state => state.config.useFileInput);
  const [promptText, setPromptText] = useState(userPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);
  const dispatch = useDispatch();
  const { handleSendPrompt } = useLLM();
  const { readFileOrDirectory } = useDirectoryReader();

  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
    dispatch(updateUserPrompt(e.target.value));
  };

  const handleSend = useCallback(async () => {
    // let updatedReferenceCodePrompt = referenceCodePrompt;
    // if (useFileInput) {
    //   const updatedContent = await readFileOrDirectory();
    //   if (updatedContent) {
    //     updatedReferenceCodePrompt = updatedContent;
    //   }
    // }
    
    // handleSendPrompt(promptText, updatedReferenceCodePrompt);
    handleSendPrompt(promptText, referenceCodePrompt);
  }, [handleSendPrompt, promptText, referenceCodePrompt, useFileInput, readFileOrDirectory]);

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
      <Card.Footer>
        <PromptAppendix />
      </Card.Footer>
    </Card>
  );
}

export default UserCard;
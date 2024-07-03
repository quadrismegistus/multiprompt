import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Card, Button, Accordion } from 'react-bootstrap';
import MarkdownRenderer from './MarkdownRenderer';
import { useLLM } from '../contexts/LLMProvider';
import PromptAppendix from './PromptAppendix';
import useStore from '../store/useStore';

function UserCard() {
  const {
    referenceCodePrompt,
    userPrompt,
    updateUserPrompt,
    
  } = useStore(state => ({
    referenceCodePrompt: state.referenceCodePrompt,
    userPrompt: state.userPrompt,
    updateUserPrompt: state.updateUserPrompt
  }));

  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);
  const { handleSendPrompt } = useLLM();

  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    updateUserPrompt(newValue);
  };

  const handleSend = useCallback(() => {
    handleSendPrompt(userPrompt, referenceCodePrompt);
  }, [handleSendPrompt, userPrompt, referenceCodePrompt]);

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
        
      {currentConversation.turns.map((turn, turnIndex) => (
          <div key={turnIndex}>
            <div className="user-prompt">
              <MarkdownRenderer content={turn.userPrompt} />
            </div>
            {turn.agentResponses.map((response, responseIndex) => (
              <div key={responseIndex} className="agent-response">
                <MarkdownRenderer content={response.response} />
                <Button onClick={() => handleRepromptAgent(response.agentId)}>
                  Reprompt
                </Button>
              </div>
            ))}
          </div>
        ))}
        
        
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className='promptarea w-100 h-100'
            value={userPrompt}
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
            <MarkdownRenderer content={userPrompt || "Click to edit prompt..."} />
          </div>
        )}
      </Card.Body>
      <Card.Footer>
        <Accordion className='agentconfig'>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Prompt appendix</Accordion.Header>
            <Accordion.Body>
              <PromptAppendix />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Footer>
    </Card>
  );
}

export default UserCard;
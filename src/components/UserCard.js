import React, { useEffect, useRef, useCallback, useState } from "react";
import { Send } from "lucide-react";
import { Card, Button, Accordion, Spinner, Form } from "react-bootstrap";
import MarkdownRenderer from "./MarkdownRenderer";
import { useLLM } from "../contexts/LLMProvider";
import PromptAppendix from "./PromptAppendix";
import { userPrompt, referenceCodePrompt, currentConversation, totalCost, updateUserPrompt, updateReferenceCodePrompt } from '../entities/main';
import { MessageList } from './Messages';

function UserCard() {
  const currentUserPrompt = userPrompt.use();
  const currentReferenceCodePrompt = referenceCodePrompt.use();
  const conversation = currentConversation.use();
  const currentTotalCost = totalCost.use();

  const textareaRef = useRef(null);
  const { handleSendPrompt } = useLLM();
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, []);

  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    updateUserPrompt(newValue);
  };
  
  const handleSend = useCallback(async () => {
    setIsSending(true);
    setAccordionOpen(false);
    updateUserPrompt(''); 
    updateReferenceCodePrompt("");
    try {
      await handleSendPrompt(currentUserPrompt, currentReferenceCodePrompt);
    } finally {
      setIsSending(false);
    }
  }, [handleSendPrompt, currentUserPrompt, currentReferenceCodePrompt]);

  const toggleAccordion = () => {
    setAccordionOpen(!accordionOpen);
  };

  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [conversation]);

  return (
    <Card className='useragent-card user-card'>
      <Card.Header className="d-flex justify-content-between align-items-start">
        <Accordion className="prompt-config w-100" style={{paddingRight:"7px"}} activeKey={accordionOpen ? "0" : null}>
          <Accordion.Item eventKey="0">
            <Accordion.Header onClick={toggleAccordion}>multiprompt</Accordion.Header>
            <Accordion.Body>
              <textarea
                ref={textareaRef}
                className="promptarea w-100"
                value={currentUserPrompt}
                onChange={handlePromptChange}
                placeholder="Enter your prompt here..."
              />      

              <Button 
                variant="primary" 
                onClick={handleSend} 
                disabled={isSending || !currentUserPrompt}
                className="px-4 py-2" 
                style={{float:'right'}}
              >
                {isSending ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="visually-hidden">Sending...</span>
                  </>
                ) : (
                  <>Send <Send size={16} className="ms-2" /></>
                )}
              </Button>

              <PromptAppendix />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Header>
      <Card.Body className="promptarea-card-body" ref={listRef}>
        <MessageList messages={conversation} />
        
        <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
          Total Cost: ${currentTotalCost}
        </div>
      </Card.Body>
    </Card>
  );
}

export default UserCard;
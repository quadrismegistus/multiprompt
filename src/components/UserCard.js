import React, { useEffect, useRef, useCallback, useState } from "react";
import { Send } from "lucide-react";
import { Card, Button, Accordion, Spinner, Form } from "react-bootstrap";
import MarkdownRenderer from "./MarkdownRenderer";
import { useLLM } from "../contexts/LLMProvider";
import PromptAppendix from "./PromptAppendix";
import useStore from "../store/useStore";
import { MessageList } from './Messages';

function UserCard() {
  const {
    referenceCodePrompt,
    userPrompt,
    updateUserPrompt,
    updateReferenceCodePrompt,
    currentConversation,
    totalCost
  } = useStore((state) => ({
    referenceCodePrompt: state.referenceCodePrompt,
    userPrompt: state.userPrompt,
    updateUserPrompt: state.updateUserPrompt,
    updateReferenceCodePrompt: state.updateReferenceCodePrompt,
    currentConversation: state.currentConversation,
    getAgentById: state.getAgentById,
    totalCost: state.totalCost
  }));

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
    console.log("Sending prompt:", userPrompt);
    setIsSending(true);
    setAccordionOpen(false);
    updateUserPrompt(''); 
    updateReferenceCodePrompt("");
    try {
      const result = await handleSendPrompt(userPrompt, referenceCodePrompt);
      console.log("Prompt sent successfully, result:", result);
    } catch (error) {
      console.error("Error sending prompt:", error);
    } finally {
      setIsSending(false);
    }
  }, [handleSendPrompt, userPrompt, referenceCodePrompt, updateUserPrompt, updateReferenceCodePrompt]);

  const toggleAccordion = () => {
    setAccordionOpen(!accordionOpen);
  };

  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [currentConversation]);

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
                value={userPrompt}
                onChange={handlePromptChange}
                placeholder="Enter your prompt here..."
              />      

              <Button 
                variant="primary" 
                onClick={handleSend} 
                disabled={isSending || !userPrompt.trim()}
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
        <MessageList messages={currentConversation} />
      </Card.Body>
    </Card>
  );
}

export default UserCard;
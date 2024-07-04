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
    currentConversation,
    getAgentById,
  } = useStore((state) => ({
    referenceCodePrompt: state.referenceCodePrompt,
    userPrompt: state.userPrompt,
    updateUserPrompt: state.updateUserPrompt,
    currentConversation: state.currentConversation,
    getAgentById: state.getAgentById,
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
    setIsSending(true);
    setAccordionOpen(false);
    updateUserPrompt(''); 
    try {
      await handleSendPrompt(userPrompt, referenceCodePrompt);
    } finally {
      setIsSending(false);
    }
  }, [handleSendPrompt, userPrompt, referenceCodePrompt]);

  const handleCardClick = () => {
    // if (textareaRef.current) {
      // textareaRef.current.focus();
    // }
  };
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
        {/* <Card.Title className="mt-1">multiprompt</Card.Title> */}
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

{/* <Accordion className="prompt-appendix" defaultActiveKey="2">
          <Accordion.Item eventKey="2">
            <Accordion.Header>Prompt appendix</Accordion.Header>
            <Accordion.Body> */}
              <PromptAppendix />
            {/* </Accordion.Body> */}
          {/* </Accordion.Item> */}
        {/* </Accordion> */}
            

            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        {/* <Button
          variant="link"
          onClick={handleSend}
          className="p-0"
          title="Send Prompt"
        >
          <Send size={24} color="royalblue" />
        </Button> */}
      </Card.Header>
      <Card.Body className="promptarea-card-body" onClick={handleCardClick} ref={listRef}>
        <MessageList messages={currentConversation} />
      </Card.Body>
    </Card>
  );
}

export default UserCard;

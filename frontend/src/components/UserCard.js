import React, { useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Card, Button, Accordion } from "react-bootstrap";
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

  const handleSend = useCallback(() => {
    handleSendPrompt(userPrompt, referenceCodePrompt);
    // updateUserPrompt(''); 
    // Clear the textarea
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
  }, [handleSendPrompt, userPrompt, referenceCodePrompt, updateUserPrompt]);

  const handleCardClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-start">
        <Card.Title className="mt-1">multiprompt</Card.Title>
        {/* <Accordion className="prompt-config w-100" style={{paddingRight:"7px"}} defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>multiprompt</Accordion.Header>
            <Accordion.Body>
            

            </Accordion.Body>
          </Accordion.Item>
        </Accordion> */}
        <Button
          variant="link"
          onClick={handleSend}
          className="p-0"
          title="Send Prompt"
        >
          <Send size={24} color="royalblue" />
        </Button>
      </Card.Header>
      <Card.Body className="promptarea-card-body" onClick={handleCardClick}>
        <MessageList messages={currentConversation} />
      </Card.Body>
      <Card.Footer>
        <Accordion className="prompt-config w-100" defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Prompt</Accordion.Header>
            <Accordion.Body>
            <textarea
                ref={textareaRef}
                className="promptarea w-100"
                value={userPrompt}
                onChange={handlePromptChange}
                placeholder="Enter your prompt here..."
              />      
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      
        <Accordion className="prompt-appendix" defaultActiveKey="2">
          <Accordion.Item eventKey="2">
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

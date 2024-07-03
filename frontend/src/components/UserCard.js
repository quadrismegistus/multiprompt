import React, { useState, useRef, useCallback } from "react";
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

  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    updateUserPrompt(newValue);
  };

  const handleSend = useCallback(() => {
    handleSendPrompt(userPrompt, referenceCodePrompt);
    updateUserPrompt(''); // Clear the prompt after sending
  }, [handleSendPrompt, userPrompt, referenceCodePrompt, updateUserPrompt]);

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-start">
        <Accordion className="prompt-config w-100" style={{paddingRight:"7px"}}>
          <Accordion.Item eventKey="0">
            <Accordion.Header>multiprompt</Accordion.Header>
            <Accordion.Body>
            <textarea
                ref={textareaRef}
                className="promptarea w-100 h-100"
                value={userPrompt}
                onChange={handlePromptChange}
                placeholder="Enter your prompt here..."
              />

            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        <Button
          variant="link"
          onClick={handleSend}
          className="p-0"
          title="Send Prompt"
        >
          <Send size={24} color="royalblue" />
        </Button>
      </Card.Header>
      <Card.Body className="promptarea-card-body">
        <MessageList messages={currentConversation} />
      </Card.Body>
      <Card.Footer>
        
        <Accordion className="prompt-appendix">
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
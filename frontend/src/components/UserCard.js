import React, { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Card, Button, Accordion } from "react-bootstrap";
import MarkdownRenderer from "./MarkdownRenderer";
import { useLLM } from "../contexts/LLMProvider";
import PromptAppendix from "./PromptAppendix";
import useStore from "../store/useStore";

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
        <Accordion className="agentconfig">
          <Accordion.Item eventKey="0">
            <Accordion.Header>multiprompt</Accordion.Header>
            <Accordion.Body></Accordion.Body>
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
        <textarea
          ref={textareaRef}
          className="promptarea w-100 h-25"
          value={userPrompt}
          onChange={handlePromptChange}
          placeholder="Enter your prompt here..."
        />
        <div className="conversation-history">
          {currentConversation.map((message, index) => (
            <div key={index} className={`message ${message.isUser ? 'user' : 'agent'}`}>
              {message.isUser ? (
                <MarkdownRenderer content={`User: ${message.content}`} />
              ) : (
                <MarkdownRenderer content={`${message.agentName}: ${message.content}`} />
              )}
            </div>
          ))}
        </div>
      </Card.Body>
      <Card.Footer>
        <Accordion className="agentconfig">
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
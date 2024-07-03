import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { Card, Button, Accordion } from "react-bootstrap";
import MarkdownRenderer from "./MarkdownRenderer";
import { useLLM } from "../contexts/LLMProvider";
import PromptAppendix from "./PromptAppendix";
import useStore from "../store/useStore";
import { MAX_CONVO_HISTORY_MSG_LEN } from "../constants";

function UserCard() {
  const {
    referenceCodePrompt,
    userPrompt,
    updateUserPrompt,
    getCurrentConversation,
  } = useStore((state) => ({
    referenceCodePrompt: state.referenceCodePrompt,
    userPrompt: state.userPrompt,
    updateUserPrompt: state.updateUserPrompt,
    getCurrentConversation: state.getCurrentConversation,
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

  const handleRepromptAgent = (agentId) => {
    const currentConversation = getCurrentConversation();
    if (currentConversation) {
      const lastTurn =
        currentConversation.turns[currentConversation.turns.length - 1];
      handleSendPrompt(lastTurn.userPrompt, referenceCodePrompt, agentId);
    }
  };

  const currentConversation = getCurrentConversation();

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
        <div>
          {currentConversation &&
            currentConversation.turns.map((turn, turnIndex) => (
              <div key={turnIndex}>
                <div className="user-prompt">
                  User prompt
                  <MarkdownRenderer
                    content={
                      typeof turn.userPrompt === "string"
                        ? turn.userPrompt.slice(0, MAX_CONVO_HISTORY_MSG_LEN)
                        : ""
                    }
                  />
                </div>
                <div>
                  {turn.agentResponses &&
                    turn.agentResponses.map((responseDict, responseIndex) => (
                      <div key={responseIndex} className="agent-response">
                        Agent response:
                        <MarkdownRenderer
                          content={
                            typeof responseDict['response'] === "string"
                              ? responseDict['response'].slice(0, MAX_CONVO_HISTORY_MSG_LEN)
                              : ""
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>

        {/* {isEditing ? (
          <textarea
            ref={textareaRef}
            className="promptarea w-100 h-100"
            value={userPrompt}
            onChange={handlePromptChange}
            placeholder="Enter your prompt here..."
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <div onclick={() => setIsEditing(true)}>
            {currentConversation &&
              currentConversation.turns.map((turn, turnIndex) => (
                <div key={turnIndex}>
                  <div className="user-prompt">
                    <MarkdownRenderer
                      content={turn.userPrompt.slice(
                        0,
                        MAX_CONVO_HISTORY_MSG_LEN
                      )}
                    />
                  </div>
                  <div>
                    {turn.agentResponses &&
                      turn.agentResponses.map((response, responseIndex) => (
                        <div key={responseIndex} className="agent-response">
                          <MarkdownRenderer
                            content={response.slice(
                              0,
                              MAX_CONVO_HISTORY_MSG_LEN
                            )}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}*/}
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

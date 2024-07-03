

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { Card, Button, Accordion } from "react-bootstrap";
import MarkdownRenderer from "./MarkdownRenderer";
import { useLLM } from "../contexts/LLMProvider";
import PromptAppendix from "./PromptAppendix";
import useStore from "../store/useStore";
import { MAX_CONVO_HISTORY_MSG_LEN } from "../constants";

function UserCard() {
  console.log('UserCard rendering');
  console.log('Store state:', useStore.getState());

  const {
    referenceCodePrompt,
    userPrompt,
    updateUserPrompt,
    getCurrentConversation,
    getAgentById,
  } = useStore((state) => ({
    referenceCodePrompt: state.referenceCodePrompt,
    userPrompt: state.userPrompt,
    updateUserPrompt: state.updateUserPrompt,
    getCurrentConversation: state.getCurrentConversation,
    getAgentById: state.getAgentById,
  }));

  console.log('getAgentById:', getAgentById);
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
        <ul>
        {currentConversation &&
            currentConversation.turns.map((turn, turnIndex) => (
              <React.Fragment key={turnIndex}>
                {/* ... (user prompt rendering remains the same) */}
                {turn.agentResponses &&
                  turn.agentResponses.slice(-1).map((responseDict, responseIndex) => {
                    console.log("Agent response:", responseDict);
                    const agent = getAgentById(responseDict.agentId);
                    console.log("Retrieved agent:", agent);
                    return (
                      <li key={responseIndex} className="agent-response">
                        <MarkdownRenderer
                          content={
                            typeof responseDict["response"] === "string"
                              ? `${agent ? agent.name : 'Unknown Agent'}: ${responseDict["response"].slice(0, MAX_CONVO_HISTORY_MSG_LEN)}`
                              : ""
                          }
                        />
                      </li>
                    );
                  })}
              </React.Fragment>
            ))}
        </ul>
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

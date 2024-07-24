import React, { useEffect, useRef, useState } from "react";
import { Card, Accordion, Button } from "react-bootstrap";
import { Trash2 } from 'lucide-react';
import useStore from "../store/useStore";
import { MessageList } from './Messages';
import PromptConfig from "./PromptConfig";

function UserCard() {
  const { currentConversation, clearCurrentConversation } = useStore();
  const [accordionOpen, setAccordionOpen] = useState(true);

  const toggleAccordion = () => {
    setAccordionOpen(!accordionOpen);
  };

  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [currentConversation]);

  const handleClearConversation = () => {
    clearCurrentConversation();
  };

  return (
    <Card className='useragent-card user-card'>
      <Card.Header className="d-flex justify-content-between align-items-start">
        <Accordion className="prompt-config w-100" style={{paddingRight:"7px"}} activeKey={accordionOpen ? "0" : null}>
          <Accordion.Item eventKey="0">
            <Accordion.Header onClick={toggleAccordion}>
              multiprompt
              <Button
                variant="link"
                className="p-0 ms-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearConversation();
                }}
                title="Clear Conversation"
                style={{float:"right"}}
              >
                <Trash2 size={18} />
              </Button>
            </Accordion.Header>
            <Accordion.Body>
              <PromptConfig />
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
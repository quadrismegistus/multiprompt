import React, { useEffect, useRef, useState } from "react";
import { Card, Accordion, } from "react-bootstrap";
import useStore from "../store/useStore";
import { MessageList } from './Messages';
import PromptConfig from "./PromptConfig";

function UserCard() {
  const { currentConversation } = useStore();
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

  return (
    <Card className='useragent-card user-card'>
      <Card.Header className="d-flex justify-content-between align-items-start">
        <Accordion className="prompt-config w-100" style={{paddingRight:"7px"}} activeKey={accordionOpen ? "0" : null}>
          <Accordion.Item eventKey="0">
            <Accordion.Header onClick={toggleAccordion}>multiprompt</Accordion.Header>
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
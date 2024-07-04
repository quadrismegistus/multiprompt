// frontend/src/components/Messages.js

import React, { useEffect, useRef, useState } from 'react';
import { Card } from 'react-bootstrap';
import './Messages.css';
import { extractTLDR } from '../utils/promptUtils';
import ReactMarkdown from 'react-markdown';
import { Modal, Button } from 'react-bootstrap';

const Message = ({ text, sender, position, onClick }) => {
  const tldrContent = extractTLDR(text);
  const msgtextstr = text || "?";
  const msgtext = tldrContent ? tldrContent : msgtextstr.slice(0, 100);

  return (
    <Card className={`message ${sender === 'User' ? 'message-user' : 'message-agent'} agentpos-${position}`} onClick={onClick}>
      <Card.Body>
        <Card.Title>{sender}</Card.Title>
        <Card.Text>
          <ReactMarkdown>{msgtext}</ReactMarkdown>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export const MessageList = ({ messages }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState('');
  const listRef = useRef(null);

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="message-list" ref={listRef}>
      {messages.map((message, index) => (
        <Message
          key={index}
          text={message.content}
          sender={message.sender}
          position={message.isUser ? 0 : message.agentPosition}
          onClick={() => handleMessageClick(message.content)}
        />
      ))}
      <MessageModal show={showModal} handleClose={handleCloseModal} message={selectedMessage} />
    </div>
  );
};



const MessageModal = ({ show, handleClose, message }) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Full Message</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MessageModal;
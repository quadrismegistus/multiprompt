// frontend/src/components/Message.js
import React from 'react';
import { Card } from 'react-bootstrap';
import './Messages.css';
import { extractTLDR } from '../utils/promptUtils';

export const Message = ({ text, sender, position }) => {
  const tldrContent = extractTLDR(text);
  return (
    <Card className={`message ${sender === 'User' ? 'message-user' : 'message-agent'} agentpos-${position}`}>
      <Card.Body>
        <Card.Text>{sender}: {tldrContent || (text ? text.slice(0, 100) : "?")}</Card.Text>
      </Card.Body>
    </Card>
  );
};





export const MessageList = ( { messages } ) => {
  console.log('got messages',messages);
  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <Message key={index} text={message.content} sender={message.sender} position={message.isUser ? 0 : message.agentPosition} />
      ))}
    </div>
  );
};


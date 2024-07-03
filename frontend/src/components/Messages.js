// frontend/src/components/Message.js
import React from 'react';
import { Card } from 'react-bootstrap';
import './Messages.css';

export const Message = ({ text, sender, position }) => {
  return (
    <Card className={`message ${sender === 'User' ? 'message-user' : 'message-agent'} agentpos-${position}`}>
      <Card.Body>
        <Card.Text>{sender}: {text}</Card.Text>
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


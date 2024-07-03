// frontend/src/components/Messages.js

import React, { useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import './Messages.css';
import { extractTLDR } from '../utils/promptUtils';
import ReactMarkdown from 'react-markdown';


const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

export const Message = ({ text, sender, position }) => {
  const tldrContent = extractTLDR(text);

  const handleCopy = () => {
    copyToClipboard(text);
  };
  const msgtextstr = text || "?"
  const msgtext = tldrContent || (msgtextstr.slice(0, 100));

  return (
    <Card className={`message ${sender === 'User' ? 'message-user' : 'message-agent'} agentpos-${position}`} onClick={handleCopy}>
      <Card.Body >
        <Card.Title>{sender}</Card.Title>
        <Card.Text>
          <ReactMarkdown>{msgtext}</ReactMarkdown>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export const MessageList = ({ messages }) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="message-list" ref={listRef}>
      {messages.map((message, index) => (
        <Message key={index} text={message.content} sender={message.sender} position={message.isUser ? 0 : message.agentPosition} />
      ))}
    </div>
  );
};

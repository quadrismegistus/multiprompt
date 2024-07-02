import React from 'react';
import { useSelector } from 'react-redux';
import MarkdownRenderer from './MarkdownRenderer';

const ConversationHistory = () => {
  const conversationHistory = useSelector(state => state.config.conversationHistory);

  return (
    <div>
      <h2>Conversation History</h2>
      {conversationHistory.map((conversation, index) => (
        <div key={index} className="conversation">
          <h3>Conversation {index + 1}</h3>
          {conversation.map(({ agent, output }, idx) => (
            <div key={idx} className="agent-response">
              <h4>{agent.name}</h4>
              <MarkdownRenderer content={output} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ConversationHistory;
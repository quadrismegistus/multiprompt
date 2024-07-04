import React from 'react';
import useStore from '../store/useStore';
import { Modal, Button } from 'react-bootstrap';
import MarkdownRenderer from './MarkdownRenderer';

const ConversationHistory = ({ show, onHide }) => {
  const conversationHistory = useStore(state => state.conversationHistory);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Conversation History</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
        {conversationHistory && conversationHistory.map((conversation, index) => (
          <div key={index} className="conversation mb-4">
            <h3>Conversation {index + 1}</h3>
            {conversation.map(({ agent, output }, idx) => (
              <div key={idx} className="agent-response mb-3">
                <h4>{agent.name}</h4>
                <MarkdownRenderer content={output.slice(0, 1000)} />
                {output.length > 1000 && <p>... (truncated)</p>}
              </div>
            ))}
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConversationHistory;
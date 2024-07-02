// src/components/IconSidebar.js
import React, { useState } from 'react';
import { Settings, History } from 'lucide-react';
import { Modal } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import ConversationHistory from './ConversationHistory'; 
import ConfigModal from './ConfigModal'; 

function IconSidebar() {
  const [showHistory, setShowHistory] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const toggleConfigModal = () => {
    setShowConfigModal(!showConfigModal);
  };

  return (
    <div className="icon-sidebar">
      <Button variant="link" onClick={toggleConfigModal} title="Settings">
        <Settings size={24} color="royalblue" />
      </Button>

      <Button variant="link" onClick={() => setShowHistory(true)} title="Show History">
        <History size={24} color="royalblue" />
      </Button>

      <Modal show={showHistory} onHide={() => setShowHistory(false)} size="lg" className="convo-history-modal">
        <Modal.Header closeButton>
          <Modal.Title>Conversation History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ConversationHistory />
        </Modal.Body>
      </Modal>

      <ConfigModal show={showConfigModal} onHide={toggleConfigModal} />
    </div>
  );
}

export default IconSidebar;
import React from 'react';
import ConfigModal from './ConfigModal';
import ConversationHistory from './ConversationHistory';
import { activeModal, hideModal } from '../entities/main';

const ModalManager = () => {
  const currentActiveModal = activeModal.use();

  const handleClose = () => {
    hideModal();
  };

  if (!currentActiveModal) return null;

  switch (currentActiveModal) {
    case 'config':
      return <ConfigModal show={true} onHide={handleClose} />;
    case 'history':
      return <ConversationHistory show={true} onHide={handleClose} />;
    default:
      return null;
  }
};

export default ModalManager;
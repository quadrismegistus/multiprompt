import React from 'react';
import useStore from '../store/useStore';
import ConfigModal from './ConfigModal';
import ConversationHistory from './ConversationHistory';

const ModalManager = () => {
  const activeModal = useStore(state => state.activeModal);
  const hideModal = useStore(state => state.hideModal);

  const handleClose = () => {
    hideModal();
  };

  if (!activeModal) return null;

  switch (activeModal) {
    case 'config':
      return <ConfigModal show={true} onHide={handleClose} />;
    case 'history':
      return <ConversationHistory show={true} onHide={handleClose} />;
    default:
      return null;
  }
};

export default ModalManager;
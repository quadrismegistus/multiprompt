import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideModal } from '../redux/actions';
import ConfigModal from './ConfigModal';
import ConversationHistory from './ConversationHistory';

const ModalManager = () => {
  const activeModal = useSelector(state => state.config.activeModal);
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(hideModal());
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
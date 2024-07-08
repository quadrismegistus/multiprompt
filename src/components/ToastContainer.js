// src/components/ToastContainer.js
import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, Toast } from 'react-bootstrap';
import { useSocket } from '../contexts/SocketContext';

const CustomToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const { socket } = useSocket();

  const addToast = useCallback((message, type = 'info') => {
    setToasts((prevToasts) => [
      ...prevToasts,
      { id: Date.now(), message, type },
    ]);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('response', (data) => {
        addToast(`Response from ${data.agent}: ${data.token}`, 'success');
      });

      socket.on('error', (error) => {
        addToast(`Error: ${error.message}`, 'danger');
      });

      return () => {
        socket.off('response');
        socket.off('error');
      };
    }
  }, [socket, addToast]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContainer position="top-end" className="p-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          onClose={() => removeToast(toast.id)}
          autohide
          delay={3000}
          bg={toast.type}
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default CustomToastContainer;

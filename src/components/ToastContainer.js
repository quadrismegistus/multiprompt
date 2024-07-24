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
      const events = [
        'connection_status', 
        'disconnect', 
        'conversation_complete', 
        'error',
        'repoContentStarted', 
        'repoContentSuccess', 
        'repoContentError',
      ];

      const eventListeners = events.map(event => ({
        event,
        handler: (data) => {
          console.log(`Event ${event} received with data:`, data);
          let toastMessage = `${event}: ${JSON.stringify(data)}`;
          let toastType = 'info';

          if (data.log) {
            toastMessage = data.log;
          } else if (data.message) {
            toastMessage = data.message;
          } else if (data.content) {
            toastMessage = data.content;
          } else if (data.error) {
            toastMessage = data.error;
            toastType = 'danger';
          }

          if (event.toLowerCase().includes('error')) {
            toastType = 'danger';
          } else if (event.toLowerCase().includes('success')) {
            toastType = 'success';
          }
          addToast(toastMessage, toastType);
        }
      }));

      eventListeners.forEach(({ event, handler }) => {
        socket.on(event, handler);
      });

      return () => {
        eventListeners.forEach(({ event, handler }) => {
          socket.off(event, handler);
        });
      };
    }
  }, [socket, addToast]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContainer position="bottom-end" className="p-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          onClose={() => removeToast(toast.id)}
          autohide
          delay={3000}
          bg={toast.type}
        >
          {/* <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header> */}
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default CustomToastContainer;

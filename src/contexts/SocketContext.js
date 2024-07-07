// src/contexts/SocketContext.js

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../constants';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const setupSocketListeners = (socket) => {
      socket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
        socket.emit('test_connection');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('test_response', (data) => {
        console.log('Received test response from server:', data);
      });

      socket.on('response', (data) => {
        console.log('Received response from server:', data);
      });

      socket.on('conversation_complete', (data) => {
        console.log('Conversation complete:', data);
      });

      socket.on('error', (error) => {
        console.error('Received error from server:', error);
      });
    };

    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setupSocketListeners(socketRef.current);

    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket');
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
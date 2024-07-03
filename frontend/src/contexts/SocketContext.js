import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../constants';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to LLM server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from LLM server');
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
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

import React, { createContext, useState, useEffect, useCallback } from 'react';

export const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket(`ws://${window.location.host}/ws/multiprompt`);
    setWs(websocket);

    websocket.onopen = () => setIsConnected(true);
    websocket.onclose = () => setIsConnected(false);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = useCallback((message) => {
    if (isConnected) {
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [isConnected, ws]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}
import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatEvent } from '../types';

export type SendMessageFunction = (event: ChatEvent) => void;

export function useWebSocket(onMessage: (event: ChatEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      setIsConnecting(true);
      setError(null);

      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setIsConnecting(false);
      };

      socket.onmessage = (event) => {
        try {
          const parsedData: ChatEvent = JSON.parse(event.data);
          onMessage(parsedData);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Failed to connect to chat server');
        setIsConnecting(false);
        setIsConnected(false);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setIsConnecting(false);
        
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
        }, 3000);
      };

      socketRef.current = socket;

      // Clean up on unmount
      return () => {
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [onMessage]);

  // Function to send messages through the WebSocket
  const sendMessage = useCallback((event: ChatEvent) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    } else {
      setError('Connection lost. Trying to reconnect...');
    }
  }, []);

  return { isConnected, isConnecting, error, sendMessage };
}

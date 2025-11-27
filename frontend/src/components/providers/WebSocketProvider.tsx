// Last Modified: 2025-11-23 17:30
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: string, handler: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        console.log('[WebSocket] Disconnecting due to auth state change');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get API URL and convert to Socket.IO URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    // Extract base URL (remove /api/v1 suffix)
    const baseUrl = apiUrl.replace(/\/api\/v1$/, '');

    console.log('[WebSocket] Connecting to Socket.IO server:', baseUrl);
    console.log('[WebSocket] Using cookie-based authentication (httpOnly cookies)');

    // Initialize Socket.IO client
    // Note: withCredentials ensures cookies are sent with the connection
    const newSocket = io(baseUrl, {
      withCredentials: true, // CRITICAL: Send httpOnly cookies with connection
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected to server:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected from server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      console.error('[WebSocket] Make sure the backend server is running on:', baseUrl);
    });

    newSocket.on('connection:established', (data) => {
      console.log('[WebSocket] Connection established:', data);
    });

    newSocket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });

    // Store socket reference
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount or auth change
    return () => {
      console.log('[WebSocket] Cleaning up connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  const subscribe = (event: string, handler: (data: any) => void) => {
    if (!socketRef.current) {
      console.warn('[WebSocket] Cannot subscribe: not connected');
      return () => {};
    }

    socketRef.current.on(event, handler);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  };

  const emit = (event: string, data: any) => {
    if (!socketRef.current || !isConnected) {
      console.warn('[WebSocket] Cannot emit: not connected');
      return;
    }

    socketRef.current.emit(event, data);
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    subscribe,
    emit,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
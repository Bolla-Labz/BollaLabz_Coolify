// Last Modified: 2025-11-23 17:30
/**
 * useWebSocket React Hook
 * React hook wrapper for WebSocketManager
 * Provides reactive state management and automatic lifecycle handling
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { WebSocketManager, WebSocketConfig, ConnectionState, WebSocketMessage } from './WebSocketManager';

export interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  maxReconnectAttempts?: number;
  connectionTimeout?: number;
  messageQueueSize?: number;
  heartbeatInterval?: number;
  enableCompression?: boolean;
  debug?: boolean;
  authToken?: string;
  onAuthExpired?: () => Promise<string>;
  autoConnect?: boolean;
}

export interface UseWebSocketReturn {
  // Connection state
  isConnected: boolean;
  connectionState: ConnectionState;

  // Connection control
  connect: () => Promise<void>;
  disconnect: (code?: number, reason?: string) => void;

  // Messaging
  send: (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => Promise<void>;
  subscribe: (type: string, handler: (payload: any) => void) => () => void;
  request: (type: string, payload: any, timeout?: number) => Promise<any>;

  // WebSocket manager instance (for advanced usage)
  wsManager: WebSocketManager | null;
}

/**
 * React hook for WebSocket connections
 *
 * @example
 * ```tsx
 * const { isConnected, send, subscribe } = useWebSocket({
 *   url: 'ws://localhost:8000',
 *   autoConnect: true,
 * });
 *
 * useEffect(() => {
 *   if (!isConnected) return;
 *
 *   const unsubscribe = subscribe('notification', (data) => {
 *     console.log('Received notification:', data);
 *   });
 *
 *   return unsubscribe;
 * }, [isConnected, subscribe]);
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    autoConnect = true,
    ...wsConfig
  } = options;

  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    lastError: null,
    latency: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesReceived: 0,
    bytesSent: 0,
  });

  // Initialize WebSocketManager
  useEffect(() => {
    if (!wsManagerRef.current) {
      wsManagerRef.current = new WebSocketManager(wsConfig);

      // Setup state listeners
      wsManagerRef.current.on('open', () => {
        setIsConnected(true);
      });

      wsManagerRef.current.on('close', () => {
        setIsConnected(false);
      });

      wsManagerRef.current.on('error', () => {
        setIsConnected(false);
      });

      wsManagerRef.current.on('stateChange', (state: ConnectionState) => {
        setConnectionState(state);
      });

      // Auto-connect if enabled
      if (autoConnect) {
        wsManagerRef.current.connect();
      }
    }

    // Cleanup on unmount
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
        wsManagerRef.current.removeAllListeners();
        wsManagerRef.current = null;
      }
    };
  }, []); // Empty deps - only run once

  // Connect function
  const connect = useCallback(async () => {
    if (wsManagerRef.current) {
      await wsManagerRef.current.connect();
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback((code?: number, reason?: string) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect(code, reason);
    }
  }, []);

  // Send function
  const send = useCallback(async (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => {
    if (wsManagerRef.current) {
      await wsManagerRef.current.send(message);
    } else {
      throw new Error('WebSocket manager not initialized');
    }
  }, []);

  // Subscribe function
  const subscribe = useCallback((type: string, handler: (payload: any) => void) => {
    if (wsManagerRef.current) {
      return wsManagerRef.current.subscribe(type, handler);
    }
    return () => {}; // No-op unsubscribe
  }, []);

  // Request function
  const request = useCallback(async (type: string, payload: any, timeout?: number) => {
    if (wsManagerRef.current) {
      return await wsManagerRef.current.request(type, payload, timeout);
    }
    throw new Error('WebSocket manager not initialized');
  }, []);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    send,
    subscribe,
    request,
    wsManager: wsManagerRef.current,
  };
}

export default useWebSocket;

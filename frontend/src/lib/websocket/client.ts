// Last Modified: 2025-11-24 02:30
/**
 * WebSocket Client - Real-time Communication
 * Manages Socket.IO connection with auto-reconnect and authentication
 * Enhanced with exponential backoff and message queuing
 */

import { io, Socket } from 'socket.io-client';
import * as Sentry from '@sentry/react';
import { useAuthStore } from '@/stores/authStore';

export type WebSocketEvent =
  | 'connection:established'
  | 'contact:created'
  | 'contact:updated'
  | 'contact:deleted'
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:status-changed'
  | 'message:received'
  | 'conversation:updated'
  | 'calendar:event-created'
  | 'calendar:event-updated'
  | 'calendar:event-deleted'
  | 'workflow:triggered'
  | 'workflow:completed'
  | 'workflow:failed'
  | 'person:created'
  | 'person:updated'
  | 'person:deleted'
  | 'connectionStatus';

export type EventHandler = (data: any) => void;

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export interface ConnectionStatusInfo {
  status: ConnectionStatus;
  attempt?: number;
  maxAttempts?: number;
  message?: string;
  reason?: string;
}

interface QueuedMessage {
  event: string;
  data: any;
  timestamp: number;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private eventHandlers: Map<WebSocketEvent, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private isConnecting = false;
  private isManualDisconnect = false;
  private messageQueue: QueuedMessage[] = [];
  private maxQueueSize = 100;
  private connectionStatus: ConnectionStatus = 'disconnected';

  /**
   * Initialize WebSocket connection
   */
  connect() {
    if (this.socket?.connected || this.isConnecting) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    const authStore = useAuthStore.getState();
    const token = authStore.accessToken;

    if (!token) {
      console.warn('[WebSocket] No authentication token available. WebSocket connection disabled.');
      return;
    }

    this.isConnecting = true;
    this.isManualDisconnect = false;

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    console.log('[WebSocket] Connecting to:', BACKEND_URL);

    this.socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  /**
   * Emit connection status change to all listeners
   */
  private emitConnectionStatus(info: ConnectionStatusInfo) {
    this.connectionStatus = info.status;
    this.notifyHandlers('connectionStatus', info);
  }

  /**
   * Set up Socket.IO event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay

      this.emitConnectionStatus({ status: 'connected' });

      // Flush queued messages
      this.flushMessageQueue();
    });

    // Connection established confirmation from server
    this.socket.on('connection:established', (data) => {
      console.log('[WebSocket] Connection established:', data);
      this.notifyHandlers('connection:established', data);
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.isConnecting = false;

      this.emitConnectionStatus({
        status: 'disconnected',
        reason
      });

      // Auto-reconnect unless it was a manual disconnect
      if (!this.isManualDisconnect && reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.isConnecting = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.emitConnectionStatus({
          status: 'failed',
          message: 'Unable to connect. Please refresh the page.',
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts
        });
      }
    });

    // Reconnection attempt
    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[WebSocket] Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);

      this.emitConnectionStatus({
        status: 'reconnecting',
        attempt,
        maxAttempts: this.maxReconnectAttempts
      });
    });

    // Reconnection success
    this.socket.io.on('reconnect', (attempt) => {
      console.log(`[WebSocket] Reconnected after ${attempt} attempts`);
      this.reconnectAttempts = 0;

      this.emitConnectionStatus({ status: 'connected' });

      // Flush queued messages
      this.flushMessageQueue();
    });

    // Reconnection failed
    this.socket.io.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');

      this.emitConnectionStatus({
        status: 'failed',
        message: 'Unable to connect. Please refresh the page.'
      });
    });

    // Pong response
    this.socket.on('pong', (data) => {
      console.log('[WebSocket] Pong received:', data);
    });

    // FIX: Add error event handler to prevent unhandled promise rejections
    // Socket.IO can emit error events that contain JSON-RPC payloads or other objects
    this.socket.on('error', (error) => {
      Sentry.startSpan(
        {
          name: 'websocket.error_event',
          op: 'websocket.client.error_event',
          attributes: {
            'error.type': typeof error,
            'error.is_object': typeof error === 'object',
          },
        },
        (span) => {
          console.error('[WebSocket] Error event received:', error);

          // Handle different error types
          let errorMessage = 'Unknown WebSocket error';
          let errorDetails: any = {};

          if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
              name: error.name,
              stack: error.stack,
            };
          } else if (typeof error === 'object' && error !== null) {
            // Handle JSON-RPC or plain object errors (common with Socket.IO)
            errorMessage = (error as any).message || JSON.stringify(error);
            errorDetails = error;
          } else {
            errorMessage = String(error);
          }

          span.setAttribute('error.message', errorMessage);
          span.setAttribute('websocket.socket_id', this.socket?.id || 'unknown');

          // Capture exception in Sentry
          Sentry.captureException(
            error instanceof Error ? error : new Error(errorMessage),
            {
              level: 'error',
              tags: {
                component: 'websocket_client',
                action: 'error_event',
                error_type: typeof error,
              },
              contexts: {
                websocket: {
                  error_message: errorMessage,
                  error_details: errorDetails,
                  socket_id: this.socket?.id,
                  connected: this.socket?.connected,
                  reconnect_attempts: this.reconnectAttempts,
                  is_manual_disconnect: this.isManualDisconnect,
                },
              },
            }
          );

          span.setStatus({ code: 2, message: 'error' });
        }
      );
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.isManualDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Subscribe to a specific event
   */
  on(event: WebSocketEvent, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());

      // Set up Socket.IO listener for this event
      if (this.socket) {
        this.socket.on(event, (data) => {
          this.notifyHandlers(event, data);
        });
      }
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from a specific event
   */
  off(event: WebSocketEvent, handler: EventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);

      // If no more handlers, remove the event listener
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
        if (this.socket) {
          this.socket.off(event);
        }
      }
    }
  }

  /**
   * Notify all handlers for an event
   */
  private notifyHandlers(event: WebSocketEvent, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Error in handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Send a ping to the server
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Get connection state
   */
  getConnectionState(): {
    connected: boolean;
    connecting: boolean;
    socketId?: string;
    reconnectAttempts: number;
    status: ConnectionStatus;
    queuedMessages: number;
  } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts,
      status: this.connectionStatus,
      queuedMessages: this.messageQueue.length,
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Emit event with automatic queuing when disconnected
   */
  emitWithQueue(event: string, data: any): void {
    if (this.isConnected() && this.socket) {
      this.socket.emit(event, data);
    } else {
      // Queue message for later delivery
      this.queueMessage(event, data);
    }
  }

  /**
   * Queue a message for later delivery
   */
  private queueMessage(event: string, data: any): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      console.warn('[WebSocket] Message queue full, dropping oldest message');
      this.messageQueue.shift();
    }

    this.messageQueue.push({
      event,
      data,
      timestamp: Date.now(),
    });

    console.log(`[WebSocket] Message queued: ${event} (queue size: ${this.messageQueue.length})`);
  }

  /**
   * Flush all queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`[WebSocket] Flushing ${this.messageQueue.length} queued messages`);

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach(({ event, data }) => {
      if (this.socket && this.isConnected()) {
        this.socket.emit(event, data);
      } else {
        // Re-queue if connection lost during flush
        this.queueMessage(event, data);
      }
    });
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();

// Export hook for React components
export const useWebSocket = () => {
  return {
    connect: () => websocketClient.connect(),
    disconnect: () => websocketClient.disconnect(),
    on: (event: WebSocketEvent, handler: EventHandler) => websocketClient.on(event, handler),
    off: (event: WebSocketEvent, handler: EventHandler) => websocketClient.off(event, handler),
    ping: () => websocketClient.ping(),
    isConnected: () => websocketClient.isConnected(),
    getState: () => websocketClient.getConnectionState(),
    getStatus: () => websocketClient.getConnectionStatus(),
    emitWithQueue: (event: string, data: any) => websocketClient.emitWithQueue(event, data),
  };
};

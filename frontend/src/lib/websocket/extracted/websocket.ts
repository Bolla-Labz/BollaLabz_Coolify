// Last Modified: 2025-11-23 17:30
import { io, Socket } from "socket.io-client";
import { WebSocketEvent, WebSocketEventType } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5678";

/**
 * WebSocket client for real-time communication
 *
 * SECURITY NOTE:
 * - Uses httpOnly cookies for authentication (withCredentials: true)
 * - No token management needed - cookies sent automatically
 * - Implements automatic reconnection with exponential backoff
 */
class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private listeners: Map<WebSocketEventType, Set<(payload: unknown) => void>> = new Map();

  constructor() {
    // Don't auto-connect - wait for explicit connect() call after auth
  }

  /**
   * Establish WebSocket connection with cookie-based authentication
   * Cookies are sent automatically via withCredentials
   *
   * DEVELOPMENT MODE: Skips connection when NODE_ENV === 'development'
   */
  public connect(): void {
    // Skip WebSocket in development mode (backend not required)
    if (process.env.NODE_ENV === 'development') {
      console.log("DEVELOPMENT MODE: Skipping WebSocket connection");
      return;
    }

    // Disconnect existing connection if any
    if (this.socket?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    this.socket = io(WS_URL, {
      // Send cookies with connection request
      withCredentials: true,
      // Prefer websocket, fallback to polling
      transports: ["websocket", "polling"],
      // Automatic reconnection config
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("WebSocket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached - circuit breaker activated");
        this.disconnect();
      } else {
        // Exponential backoff (max 30 seconds)
        this.reconnectDelay = Math.min(30000, this.reconnectDelay * 2);
      }
    });

    // Listen for all event types defined in WebSocketEventType enum
    Object.values(WebSocketEventType).forEach((eventType) => {
      this.socket?.on(eventType, (payload: unknown) => {
        this.handleEvent({ type: eventType, payload });
      });
    });
  }

  /**
   * Handle incoming WebSocket events and notify registered listeners
   */
  private handleEvent(event: WebSocketEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => callback(event.payload));
    }
  }

  /**
   * Register event listener
   */
  public on(eventType: WebSocketEventType, callback: (payload: unknown) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);
  }

  /**
   * Unregister event listener
   */
  public off(eventType: WebSocketEventType, callback: (payload: unknown) => void): void {
    this.listeners.get(eventType)?.delete(callback);
  }

  /**
   * Emit event to server
   */
  public emit(eventType: string, payload: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(eventType, payload);
    } else {
      console.warn("WebSocket not connected, cannot emit event:", eventType);
    }
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Force reconnection
   */
  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.connect();
  }

  /**
   * Check connection status
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance - shared across the application
export const wsClient = new WebSocketClient();

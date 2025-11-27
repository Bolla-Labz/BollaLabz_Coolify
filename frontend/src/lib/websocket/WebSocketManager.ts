// Last Modified: 2025-11-23 17:30
/**
 * BollaLabz WebSocket Manager
 * Production-grade real-time communication aligned with project vision:
 * - Seamless Extension: Invisible reconnection and recovery
 * - Zero Cognitive Load: Automatic message queuing and retry
 * - Production Reliability: Comprehensive error handling
 */

import { SecurityAudit } from '@/lib/security';

// Browser-compatible EventEmitter
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener: Function): this {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (listeners && listeners.length > 0) {
      listeners.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

// ============================================
// TYPES AND INTERFACES
// ============================================

export interface WebSocketConfig {
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
}

export interface WebSocketMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retry?: number;
  priority?: 'high' | 'normal' | 'low';
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';
  reconnectAttempts: number;
  lastConnectedAt: number | null;
  lastDisconnectedAt: number | null;
  lastError: Error | null;
  latency: number;
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
}

export type WebSocketEventMap = {
  'open': (event: Event) => void;
  'close': (event: CloseEvent) => void;
  'error': (error: Error) => void;
  'message': (message: WebSocketMessage) => void;
  'reconnecting': (attempt: number) => void;
  'reconnected': () => void;
  'stateChange': (state: ConnectionState) => void;
  'heartbeat': (latency: number) => void;
};

// ============================================
// MESSAGE QUEUE
// ============================================

class MessageQueue {
  private queue: WebSocketMessage[] = [];
  private maxSize: number;
  private priorityQueues: Map<string, WebSocketMessage[]> = new Map([
    ['high', []],
    ['normal', []],
    ['low', []],
  ]);

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Add message to queue with priority support
   */
  enqueue(message: WebSocketMessage): boolean {
    const priority = message.priority || 'normal';
    const queue = this.priorityQueues.get(priority)!;

    if (this.size() >= this.maxSize) {
      // Remove oldest low priority message
      const lowQueue = this.priorityQueues.get('low')!;
      if (lowQueue.length > 0) {
        lowQueue.shift();
      } else {
        return false; // Queue is full
      }
    }

    queue.push(message);
    return true;
  }

  /**
   * Get next message respecting priority
   */
  dequeue(): WebSocketMessage | null {
    // Check high priority first
    for (const priority of ['high', 'normal', 'low']) {
      const queue = this.priorityQueues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift()!;
      }
    }
    return null;
  }

  /**
   * Get all queued messages
   */
  getAll(): WebSocketMessage[] {
    const messages: WebSocketMessage[] = [];
    for (const priority of ['high', 'normal', 'low']) {
      messages.push(...this.priorityQueues.get(priority)!);
    }
    return messages;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.priorityQueues.forEach(queue => queue.length = 0);
  }

  /**
   * Get queue size
   */
  size(): number {
    let total = 0;
    this.priorityQueues.forEach(queue => total += queue.length);
    return total;
  }

  /**
   * Remove a specific message by ID
   */
  remove(messageId: string): boolean {
    for (const queue of this.priorityQueues.values()) {
      const index = queue.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        queue.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}

// ============================================
// CONNECTION METRICS
// ============================================

class ConnectionMetrics {
  private metrics: ConnectionState = {
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
  };

  private latencyHistory: number[] = [];
  private readonly maxHistorySize = 100;

  /**
   * Update connection status
   */
  updateStatus(status: ConnectionState['status']): void {
    this.metrics.status = status;

    if (status === 'connected') {
      this.metrics.lastConnectedAt = Date.now();
      this.metrics.reconnectAttempts = 0;
    } else if (status === 'disconnected') {
      this.metrics.lastDisconnectedAt = Date.now();
    }
  }

  /**
   * Record reconnection attempt
   */
  recordReconnectAttempt(): void {
    this.metrics.reconnectAttempts++;
  }

  /**
   * Record error
   */
  recordError(error: Error): void {
    this.metrics.lastError = error;
  }

  /**
   * Record message sent
   */
  recordMessageSent(bytes: number): void {
    this.metrics.messagesSent++;
    this.metrics.bytesSent += bytes;
  }

  /**
   * Record message received
   */
  recordMessageReceived(bytes: number): void {
    this.metrics.messagesReceived++;
    this.metrics.bytesReceived += bytes;
  }

  /**
   * Update latency
   */
  updateLatency(latency: number): void {
    this.metrics.latency = latency;
    this.latencyHistory.push(latency);

    if (this.latencyHistory.length > this.maxHistorySize) {
      this.latencyHistory.shift();
    }
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return sum / this.latencyHistory.length;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ConnectionState {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
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
    };
    this.latencyHistory = [];
  }
}

// ============================================
// MAIN WEBSOCKET MANAGER
// ============================================

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private messageQueue: MessageQueue;
  private metrics: ConnectionMetrics;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private reconnectAttempt = 0;
  private pendingMessages: Map<string, WebSocketMessage> = new Map();
  private messageHandlers: Map<string, Set<Function>> = new Map();

  constructor(config: WebSocketConfig) {
    super();

    // Set default configuration
    this.config = {
      url: config.url,
      protocols: config.protocols,
      reconnectInterval: config.reconnectInterval || 1000,
      maxReconnectInterval: config.maxReconnectInterval || 30000,
      reconnectDecay: config.reconnectDecay || 1.5,
      maxReconnectAttempts: config.maxReconnectAttempts || Infinity,
      connectionTimeout: config.connectionTimeout || 10000,
      messageQueueSize: config.messageQueueSize || 1000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      enableCompression: config.enableCompression !== false,
      debug: config.debug || false,
      authToken: config.authToken || '',
      onAuthExpired: config.onAuthExpired || (() => Promise.resolve('')),
    };

    this.messageQueue = new MessageQueue(this.config.messageQueueSize);
    this.metrics = new ConnectionMetrics();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    this.metrics.updateStatus('connecting');
    this.emit('stateChange', this.metrics.getMetrics());

    try {
      // Check and refresh auth token if needed
      if (this.config.authToken) {
        this.config.authToken = await this.ensureValidAuth();
      }

      // Create WebSocket connection
      const url = this.buildConnectionUrl();
      this.ws = new WebSocket(url, this.config.protocols);

      // Set binary type for efficient data transfer
      this.ws.binaryType = 'arraybuffer';

      // Setup event handlers
      this.setupEventHandlers();

      // Start connection timeout
      this.startConnectionTimeout();

    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(code = 1000, reason = 'Normal closure'): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    this.stopReconnectTimer();
    this.stopConnectionTimeout();

    if (this.ws) {
      this.metrics.updateStatus('disconnecting');
      this.emit('stateChange', this.metrics.getMetrics());

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(code, reason);
      } else {
        this.ws = null;
        this.metrics.updateStatus('disconnected');
        this.emit('stateChange', this.metrics.getMetrics());
      }
    }
  }

  /**
   * Send a message through WebSocket
   */
  async send(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
    };

    if (!this.isConnected()) {
      // Queue message for later delivery
      if (!this.messageQueue.enqueue(fullMessage)) {
        throw new Error('Message queue is full');
      }
      this.log('Message queued for delivery when connected');
      return;
    }

    try {
      await this.sendMessage(fullMessage);
    } catch (error) {
      // Requeue message on failure
      this.messageQueue.enqueue(fullMessage);
      throw error;
    }
  }

  /**
   * Subscribe to a specific message type
   */
  subscribe(type: string, handler: (payload: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Request-response pattern with timeout
   */
  async request(
    type: string,
    payload: any,
    timeout = 30000
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const messageId = this.generateMessageId();
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      // Store pending message
      this.pendingMessages.set(messageId, {
        id: messageId,
        type,
        payload,
        timestamp: Date.now(),
      });

      // Subscribe to response
      const unsubscribe = this.subscribe(`${type}_response`, (response) => {
        if (response.requestId === messageId) {
          clearTimeout(timeoutId);
          this.pendingMessages.delete(messageId);
          unsubscribe();
          resolve(response);
        }
      });

      // Send request
      try {
        await this.send({
          type,
          payload: { ...payload, requestId: messageId },
          priority: 'high',
        });
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingMessages.delete(messageId);
        unsubscribe();
        reject(error);
      }
    });
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return this.metrics.getMetrics();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.log('Connection established');
    this.stopConnectionTimeout();
    this.reconnectAttempt = 0;
    this.metrics.updateStatus('connected');
    this.emit('open', event);
    this.emit('stateChange', this.metrics.getMetrics());

    // Send authentication if required
    if (this.config.authToken) {
      this.authenticate();
    }

    // Start heartbeat
    this.startHeartbeat();

    // Flush message queue
    this.flushMessageQueue();

    // Emit reconnected event if this was a reconnection
    if (this.metrics.getMetrics().reconnectAttempts > 0) {
      this.emit('reconnected');
      SecurityAudit.log('WebSocket reconnected', 'info', {
        attempts: this.metrics.getMetrics().reconnectAttempts,
      });
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log(`Connection closed: ${event.code} - ${event.reason}`);
    this.stopHeartbeat();
    this.stopConnectionTimeout();
    this.ws = null;
    this.metrics.updateStatus('disconnected');
    this.emit('close', event);
    this.emit('stateChange', this.metrics.getMetrics());

    // Log abnormal closures
    if (event.code !== 1000) {
      SecurityAudit.log('WebSocket abnormal closure', 'warning', {
        code: event.code,
        reason: event.reason,
      });
    }

    // Attempt reconnection if not intentionally closed
    if (!this.isIntentionallyClosed && this.shouldReconnect()) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    // Extract diagnostic information
    const readyState = this.ws?.readyState;
    const readyStateMap: Record<number, string> = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED',
    };

    const diagnostics = {
      url: this.config.url,
      readyState: readyState !== undefined ? readyStateMap[readyState] : 'UNKNOWN',
      readyStateCode: readyState,
      reconnectAttempt: this.reconnectAttempt,
      isIntentionallyClosed: this.isIntentionallyClosed,
      hasAuthToken: !!this.config.authToken,
      eventType: event.type,
    };

    const error = new Error(
      `WebSocket error: Failed to connect to ${this.config.url} (readyState: ${diagnostics.readyState}, attempt: ${this.reconnectAttempt + 1})`
    );

    this.log('Connection error', { error, diagnostics });
    this.metrics.recordError(error);
    this.metrics.updateStatus('error');
    this.emit('error', error);
    this.emit('stateChange', this.metrics.getMetrics());

    SecurityAudit.log('WebSocket error', 'error', {
      error: error.message,
      diagnostics,
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = this.parseMessage(event.data);
      this.metrics.recordMessageReceived(event.data.length);

      // Handle different message types
      if (data.type === 'pong') {
        this.handlePong(data);
      } else if (data.type === 'auth_required') {
        this.handleAuthRequired();
      } else if (data.type === 'auth_success') {
        this.log('Authentication successful');
      } else if (data.type === 'auth_failed') {
        this.handleAuthFailed(data);
      } else {
        // Emit message event
        this.emit('message', data);

        // Call specific handlers
        const handlers = this.messageHandlers.get(data.type);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(data.payload);
            } catch (error) {
              console.error(`Error in message handler for ${data.type}:`, error);
            }
          });
        }
      }
    } catch (error) {
      this.log('Failed to parse message', error);
      SecurityAudit.log('WebSocket message parse error', 'error', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Parse incoming message
   */
  private parseMessage(data: any): WebSocketMessage {
    if (data instanceof ArrayBuffer) {
      // Binary message - decode
      const decoder = new TextDecoder();
      const text = decoder.decode(data);
      return JSON.parse(text);
    } else if (typeof data === 'string') {
      // Text message
      return JSON.parse(data);
    } else {
      throw new Error('Unknown message format');
    }
  }

  /**
   * Send a message
   */
  private async sendMessage(message: WebSocketMessage): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    try {
      const data = JSON.stringify(message);
      this.ws!.send(data);
      this.metrics.recordMessageSent(data.length);
      this.log(`Message sent: ${message.type}`);
    } catch (error) {
      this.log('Failed to send message', error);
      throw error;
    }
  }

  /**
   * Flush queued messages
   */
  private async flushMessageQueue(): Promise<void> {
    const messages = this.messageQueue.getAll();
    this.messageQueue.clear();

    for (const message of messages) {
      try {
        await this.sendMessage(message);
      } catch (error) {
        // Re-queue failed message
        this.messageQueue.enqueue(message);
        this.log(`Failed to flush message: ${message.type}`, error);
      }
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = this.calculateReconnectDelay();
    this.log(`Scheduling reconnection in ${delay}ms`);
    this.metrics.recordReconnectAttempt();
    this.emit('reconnecting', this.reconnectAttempt);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    const { reconnectInterval, maxReconnectInterval, reconnectDecay } = this.config;
    const delay = Math.min(
      reconnectInterval * Math.pow(reconnectDecay, this.reconnectAttempt),
      maxReconnectInterval
    );
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.round(delay + jitter);
  }

  /**
   * Check if should reconnect
   */
  private shouldReconnect(): boolean {
    return this.reconnectAttempt < this.config.maxReconnectAttempts;
  }

  /**
   * Stop reconnection timer
   */
  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const pingTime = Date.now();
        this.send({
          type: 'ping',
          payload: { timestamp: pingTime },
          priority: 'high',
        }).catch(error => {
          this.log('Heartbeat failed', error);
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Handle pong message
   */
  private handlePong(message: WebSocketMessage): void {
    const latency = Date.now() - message.payload.timestamp;
    this.metrics.updateLatency(latency);
    this.emit('heartbeat', latency);
    this.log(`Heartbeat latency: ${latency}ms`);
  }

  /**
   * Start connection timeout
   */
  private startConnectionTimeout(): void {
    this.connectionTimer = setTimeout(() => {
      if (!this.isConnected()) {
        this.log('Connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
        if (this.ws) {
          this.ws.close();
        }
      }
    }, this.config.connectionTimeout);
  }

  /**
   * Stop connection timeout
   */
  private stopConnectionTimeout(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    this.metrics.recordError(error);
    this.emit('error', error);
    SecurityAudit.log('WebSocket connection error', 'error', {
      error: error.message,
    });
  }

  /**
   * Build connection URL with query parameters
   */
  private buildConnectionUrl(): string {
    const url = new URL(this.config.url);

    // Add auth token if available
    if (this.config.authToken) {
      url.searchParams.set('token', this.config.authToken);
    }

    // Add client info
    url.searchParams.set('client', 'bollalabz-web');
    url.searchParams.set('version', '1.0.0');

    return url.toString();
  }

  /**
   * Authenticate connection
   */
  private async authenticate(): Promise<void> {
    await this.send({
      type: 'auth',
      payload: { token: this.config.authToken },
      priority: 'high',
    });
  }

  /**
   * Handle authentication required
   */
  private async handleAuthRequired(): Promise<void> {
    this.log('Authentication required');
    const newToken = await this.config.onAuthExpired();
    if (newToken) {
      this.config.authToken = newToken;
      await this.authenticate();
    } else {
      this.disconnect(4001, 'Authentication failed');
    }
  }

  /**
   * Handle authentication failed
   */
  private handleAuthFailed(message: WebSocketMessage): void {
    this.log('Authentication failed', message.payload);
    this.disconnect(4001, 'Authentication failed');
    SecurityAudit.log('WebSocket authentication failed', 'error', message.payload);
  }

  /**
   * Ensure valid authentication
   */
  private async ensureValidAuth(): Promise<string> {
    // Check if token is expired (implement your logic)
    // For now, return the existing token
    return this.config.authToken;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Debug logging
   */
  private log(message: string, error?: any): void {
    if (this.config.debug) {
      if (error) {
        console.error(`[WebSocket] ${message}`, error);
      } else {
        console.log(`[WebSocket] ${message}`);
      }
    }
  }
}


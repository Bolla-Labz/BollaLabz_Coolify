// Last Modified: 2025-11-24 00:15
/**
 * WebSocket Service - Real-time Communication
 * Handles Socket.IO server setup, authentication, and event management
 * Features: Room-based messaging, presence detection, typing indicators, read receipts
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();

    // Room management: Map<roomId, Set<userId>>
    this.rooms = new Map();

    // Presence tracking: Map<roomId, Set<userId>>
    this.presenceByRoom = new Map();

    // Typing indicators: Map<roomId, Map<userId, timeout>>
    this.typingUsers = new Map();

    // Read receipts: Map<messageId, Set<userId>>
    this.readReceipts = new Map();

    // Auto-clear read receipts after 1 hour
    this.receiptCleanupInterval = null;
  }

  /**
   * Initialize Socket.IO server
   * @param {http.Server} httpServer - Express HTTP server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      // Try to get token from auth (for backward compatibility)
      let token = socket.handshake.auth.token;

      // If not in auth, extract from httpOnly cookie
      if (!token) {
        const cookieHeader = socket.handshake.headers.cookie;
        if (cookieHeader) {
          // Parse cookies manually (Socket.IO doesn't use cookie-parser middleware)
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {});
          
          // Decode the cookie value since Express URL-encodes it
          token = cookies.accessToken ? decodeURIComponent(cookies.accessToken) : undefined;
        }
      }

      if (!token) {
        logger.warn('WebSocket authentication failed: No token provided');
        return next(new Error('Authentication token required'));
      }

      try {
        // Verify JWT token - SECURITY: No fallback secret allowed
        if (!process.env.JWT_SECRET) {
          logger.error('JWT_SECRET not configured for WebSocket authentication');
          return next(new Error('Server authentication not configured'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      const { userId, userEmail } = socket;

      logger.info(`WebSocket client connected: ${socket.id} (User: ${userEmail})`);

      // Store connected client
      this.connectedClients.set(socket.id, {
        socketId: socket.id,
        userId,
        userEmail,
        connectedAt: new Date().toISOString()
      });

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Send welcome message
      socket.emit('connection:established', {
        message: 'WebSocket connection established',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`WebSocket client disconnected: ${socket.id} (Reason: ${reason})`);
        this.connectedClients.delete(socket.id);

        // Remove user from all rooms and broadcast user_left
        this.rooms.forEach((users, roomId) => {
          if (users.has(userId)) {
            this.removeUserFromRoom(roomId, userId);
            this.io.to(roomId).emit('user_left', {
              roomId,
              userId,
              userEmail,
              timestamp: new Date().toISOString(),
            });
          }
        });

        // Clear typing indicators
        this.typingUsers.forEach((userMap, roomId) => {
          if (userMap.has(userId)) {
            const timeout = userMap.get(userId);
            if (timeout && typeof timeout !== 'boolean') {
              clearTimeout(timeout);
            }
            userMap.delete(userId);
          }
        });
      });

      // Handle client ping
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // ===== ROOM MANAGEMENT =====

      // Join room
      socket.on('join_room', ({ roomId }) => {
        if (!roomId) {
          socket.emit('error', { message: 'Room ID required' });
          return;
        }

        socket.join(roomId);
        this.addUserToRoom(roomId, userId);
        logger.info(`User ${userEmail} joined room: ${roomId}`);

        // Broadcast user joined event to room members
        socket.to(roomId).emit('user_joined', {
          roomId,
          userId,
          userEmail,
          timestamp: new Date().toISOString(),
        });

        // Send current room users to the joining user
        const roomUsers = this.getRoomUsers(roomId);
        socket.emit('presence_update', {
          roomId,
          users: Array.from(roomUsers),
          timestamp: new Date().toISOString(),
        });
      });

      // Leave room
      socket.on('leave_room', ({ roomId }) => {
        if (!roomId) return;

        socket.leave(roomId);
        this.removeUserFromRoom(roomId, userId);
        logger.info(`User ${userEmail} left room: ${roomId}`);

        // Broadcast user left event
        socket.to(roomId).emit('user_left', {
          roomId,
          userId,
          userEmail,
          timestamp: new Date().toISOString(),
        });
      });

      // ===== TYPING INDICATORS =====

      // Typing start
      socket.on('typing_start', ({ roomId }) => {
        if (!roomId) return;

        this.setUserTyping(roomId, userId, true);

        // Broadcast to room (except sender)
        socket.to(roomId).emit('typing', {
          roomId,
          userId,
          userEmail,
          isTyping: true,
          timestamp: new Date().toISOString(),
        });

        // Auto-clear typing after 3 seconds
        const typingTimeout = setTimeout(() => {
          this.setUserTyping(roomId, userId, false);
          socket.to(roomId).emit('typing', {
            roomId,
            userId,
            userEmail,
            isTyping: false,
            timestamp: new Date().toISOString(),
          });
        }, 3000);

        // Store timeout for manual clearing
        if (!this.typingUsers.has(roomId)) {
          this.typingUsers.set(roomId, new Map());
        }
        this.typingUsers.get(roomId).set(userId, typingTimeout);
      });

      // Typing stop
      socket.on('typing_stop', ({ roomId }) => {
        if (!roomId) return;

        // Clear timeout
        const roomTyping = this.typingUsers.get(roomId);
        if (roomTyping && roomTyping.has(userId)) {
          clearTimeout(roomTyping.get(userId));
          roomTyping.delete(userId);
        }

        this.setUserTyping(roomId, userId, false);

        // Broadcast to room
        socket.to(roomId).emit('typing', {
          roomId,
          userId,
          userEmail,
          isTyping: false,
          timestamp: new Date().toISOString(),
        });
      });

      // ===== READ RECEIPTS =====

      // Mark message as read
      socket.on('message_read', ({ messageId, roomId }) => {
        if (!messageId) return;

        this.addReadReceipt(messageId, userId);

        // Broadcast read receipt to room
        if (roomId) {
          socket.to(roomId).emit('read_receipt', {
            messageId,
            userId,
            userEmail,
            timestamp: new Date().toISOString(),
          });
        }

        logger.debug(`Message ${messageId} marked as read by ${userEmail}`);
      });

      // Get read receipts for a message
      socket.on('get_read_receipts', ({ messageId }, callback) => {
        const receipts = this.getReadReceipts(messageId);
        if (typeof callback === 'function') {
          callback({
            messageId,
            readBy: Array.from(receipts),
            count: receipts.size,
          });
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`WebSocket error for ${socket.id}:`, error);
      });
    });

    // Start cleanup for read receipts
    this.startReadReceiptsCleanup();

    logger.info('✓ WebSocket service initialized successfully');
  }

  /**
   * Emit event to specific user
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emitToUser(userId, event, data) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Event emitted to user ${userId}: ${event}`);
  }

  /**
   * Emit event to all connected clients
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emitToAll(event, data) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Event broadcasted to all clients: ${event}`);
  }

  /**
   * Get connected clients count
   * @returns {number}
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients info
   * @returns {Array}
   */
  getConnectedClients() {
    return Array.from(this.connectedClients.values());
  }

  /**
   * Check if user is connected
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  isUserConnected(userId) {
    return Array.from(this.connectedClients.values()).some(
      client => client.userId === userId
    );
  }

  // ===== ROOM MANAGEMENT METHODS =====

  /**
   * Add user to a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   */
  addUserToRoom(roomId, userId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);

    // Track presence
    if (!this.presenceByRoom.has(roomId)) {
      this.presenceByRoom.set(roomId, new Set());
    }
    this.presenceByRoom.get(roomId).add(userId);
  }

  /**
   * Remove user from a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   */
  removeUserFromRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    // Remove from presence
    const presence = this.presenceByRoom.get(roomId);
    if (presence) {
      presence.delete(userId);
      if (presence.size === 0) {
        this.presenceByRoom.delete(roomId);
      }
    }
  }

  /**
   * Get all users in a room
   * @param {string} roomId - Room ID
   * @returns {Set<string>}
   */
  getRoomUsers(roomId) {
    return this.rooms.get(roomId) || new Set();
  }

  /**
   * Broadcast message to room
   * @param {string} roomId - Room ID
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  broadcastToRoom(roomId, event, data) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(roomId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Event broadcasted to room ${roomId}: ${event}`);
  }

  // ===== TYPING INDICATOR METHODS =====

  /**
   * Set user typing status
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @param {boolean} isTyping - Typing status
   */
  setUserTyping(roomId, userId, isTyping) {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Map());
    }

    if (isTyping) {
      this.typingUsers.get(roomId).set(userId, true);
    } else {
      this.typingUsers.get(roomId).delete(userId);
    }
  }

  /**
   * Get typing users in room
   * @param {string} roomId - Room ID
   * @returns {Set<string>}
   */
  getTypingUsers(roomId) {
    const typingMap = this.typingUsers.get(roomId);
    if (!typingMap) return new Set();
    return new Set(typingMap.keys());
  }

  // ===== READ RECEIPT METHODS =====

  /**
   * Add read receipt for message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   */
  addReadReceipt(messageId, userId) {
    if (!this.readReceipts.has(messageId)) {
      this.readReceipts.set(messageId, new Set());
    }
    this.readReceipts.get(messageId).add(userId);
  }

  /**
   * Get read receipts for message
   * @param {string} messageId - Message ID
   * @returns {Set<string>}
   */
  getReadReceipts(messageId) {
    return this.readReceipts.get(messageId) || new Set();
  }

  /**
   * Start read receipts cleanup (called on initialization)
   */
  startReadReceiptsCleanup() {
    // Clean up read receipts older than 1 hour every 30 minutes
    this.receiptCleanupInterval = setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const keysToDelete = [];

      for (const [messageId, receipts] of this.readReceipts.entries()) {
        // Check if message ID contains timestamp (format: timestamp_randomstring)
        const timestamp = parseInt(messageId.split('_')[0]);
        if (timestamp && timestamp < oneHourAgo) {
          keysToDelete.push(messageId);
        }
      }

      keysToDelete.forEach(key => this.readReceipts.delete(key));

      if (keysToDelete.length > 0) {
        logger.debug(`Cleaned up ${keysToDelete.length} old read receipts`);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  /**
   * Stop read receipts cleanup
   */
  stopReadReceiptsCleanup() {
    if (this.receiptCleanupInterval) {
      clearInterval(this.receiptCleanupInterval);
      this.receiptCleanupInterval = null;
    }
  }

  // ===== Contact Events =====

  emitContactCreated(userId, contact) {
    this.emitToUser(userId, 'contact:created', { contact });
  }

  emitContactUpdated(userId, contact) {
    this.emitToUser(userId, 'contact:updated', { contact });
  }

  emitContactDeleted(userId, contactId) {
    this.emitToUser(userId, 'contact:deleted', { contactId });
  }

  // ===== Task Events =====

  emitTaskCreated(userId, task) {
    this.emitToUser(userId, 'task:created', { task });
  }

  emitTaskUpdated(userId, task) {
    this.emitToUser(userId, 'task:updated', { task });
  }

  emitTaskDeleted(userId, taskId) {
    this.emitToUser(userId, 'task:deleted', { taskId });
  }

  emitTaskStatusChanged(userId, taskId, oldStatus, newStatus) {
    this.emitToUser(userId, 'task:status-changed', {
      taskId,
      oldStatus,
      newStatus
    });
  }

  // ===== Message/Conversation Events =====

  emitMessageReceived(userId, message) {
    this.emitToUser(userId, 'message:received', { message });
  }

  emitConversationUpdated(userId, conversation) {
    this.emitToUser(userId, 'conversation:updated', { conversation });
  }

  // ===== Calendar Events =====

  emitCalendarEventCreated(userId, event) {
    this.emitToUser(userId, 'calendar:event-created', { event });
  }

  emitCalendarEventUpdated(userId, event) {
    this.emitToUser(userId, 'calendar:event-updated', { event });
  }

  emitCalendarEventDeleted(userId, eventId) {
    this.emitToUser(userId, 'calendar:event-deleted', { eventId });
  }

  // ===== Workflow Events =====

  emitWorkflowTriggered(userId, workflow) {
    this.emitToUser(userId, 'workflow:triggered', { workflow });
  }

  emitWorkflowCompleted(userId, workflowId, result) {
    this.emitToUser(userId, 'workflow:completed', { workflowId, result });
  }

  emitWorkflowFailed(userId, workflowId, error) {
    this.emitToUser(userId, 'workflow:failed', { workflowId, error });
  }

  // ===== People/CRM Events =====

  emitPersonCreated(userId, person) {
    this.emitToUser(userId, 'person:created', { person });
  }

  emitPersonUpdated(userId, person) {
    this.emitToUser(userId, 'person:updated', { person });
  }

  emitPersonDeleted(userId, personId) {
    this.emitToUser(userId, 'person:deleted', { personId });
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;

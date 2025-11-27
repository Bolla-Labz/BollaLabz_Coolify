// Last Modified: 2025-11-24 00:15
/**
 * usePresence Hook
 * Manages room-based presence detection with WebSocket
 * Automatically handles join/leave, typing indicators, and read receipts
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket/useWebSocket';

export interface OnlineUser {
  userId: string;
  userEmail: string;
  name?: string;
  avatar?: string;
}

export interface TypingUser {
  userId: string;
  userEmail: string;
  name?: string;
  avatar?: string;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  userEmail: string;
  timestamp: string;
}

interface UsePresenceOptions {
  /** Room ID to join */
  roomId: string;
  /** Auto-join room on mount */
  autoJoin?: boolean;
  /** User info for display */
  currentUser?: {
    name?: string;
    avatar?: string;
  };
}

interface UsePresenceReturn {
  /** Users currently online in the room */
  onlineUsers: OnlineUser[];
  /** Users currently typing in the room */
  typingUsers: TypingUser[];
  /** Read receipts by message ID */
  readReceipts: Map<string, Set<string>>;
  /** Join the room */
  joinRoom: () => void;
  /** Leave the room */
  leaveRoom: () => void;
  /** Start typing */
  startTyping: () => void;
  /** Stop typing */
  stopTyping: () => void;
  /** Mark message as read */
  markAsRead: (messageId: string) => void;
  /** Get read receipts for a message */
  getReadReceipts: (messageId: string) => Promise<{
    messageId: string;
    readBy: string[];
    count: number;
  }>;
  /** Whether currently in the room */
  isInRoom: boolean;
}

export function usePresence({
  roomId,
  autoJoin = true,
  currentUser,
}: UsePresenceOptions): UsePresenceReturn {
  const { isConnected, subscribe, send, wsManager } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
    autoConnect: true,
  });

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [readReceipts, setReadReceipts] = useState<Map<string, Set<string>>>(new Map());
  const [isInRoom, setIsInRoom] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Join room
  const joinRoom = useCallback(() => {
    if (!isConnected) return;

    send({
      type: 'join_room',
      payload: { roomId },
    }).catch(err => {
      console.error('Failed to join room:', err);
    });

    setIsInRoom(true);
  }, [isConnected, roomId, send]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!isConnected) return;

    send({
      type: 'leave_room',
      payload: { roomId },
    }).catch(err => {
      console.error('Failed to leave room:', err);
    });

    setIsInRoom(false);
  }, [isConnected, roomId, send]);

  // Start typing
  const startTyping = useCallback(() => {
    if (!isConnected || !isInRoom) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start if not already typing
    if (!isTypingRef.current) {
      send({
        type: 'typing_start',
        payload: { roomId },
      }).catch(err => {
        console.error('Failed to send typing start:', err);
      });

      isTypingRef.current = true;
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [isConnected, isInRoom, roomId, send]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!isConnected || !isInRoom || !isTypingRef.current) return;

    send({
      type: 'typing_stop',
      payload: { roomId },
    }).catch(err => {
      console.error('Failed to send typing stop:', err);
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    isTypingRef.current = false;
  }, [isConnected, isInRoom, roomId, send]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    if (!isConnected || !isInRoom) return;

    send({
      type: 'message_read',
      payload: { messageId, roomId },
    }).catch(err => {
      console.error('Failed to mark message as read:', err);
    });
  }, [isConnected, isInRoom, roomId, send]);

  // Get read receipts for a message
  const getReadReceipts = useCallback(async (messageId: string) => {
    if (!wsManager) {
      return { messageId, readBy: [], count: 0 };
    }

    try {
      const response = await wsManager.request('get_read_receipts', { messageId }, 5000);
      return response;
    } catch (err) {
      console.error('Failed to get read receipts:', err);
      return { messageId, readBy: [], count: 0 };
    }
  }, [wsManager]);

  // Auto-join room on mount
  useEffect(() => {
    if (isConnected && autoJoin && roomId) {
      joinRoom();
    }

    return () => {
      if (isInRoom) {
        leaveRoom();
      }
    };
  }, [isConnected, autoJoin, roomId]); // Only re-run if these change

  // Subscribe to presence updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribePresence = subscribe('presence_update', (payload: any) => {
      if (payload.roomId === roomId) {
        setOnlineUsers(payload.users || []);
      }
    });

    const unsubscribeUserJoined = subscribe('user_joined', (payload: any) => {
      if (payload.roomId === roomId) {
        setOnlineUsers(prev => {
          // Check if user already exists
          const exists = prev.some(u => u.userId === payload.userId);
          if (exists) return prev;

          return [
            ...prev,
            {
              userId: payload.userId,
              userEmail: payload.userEmail,
            },
          ];
        });
      }
    });

    const unsubscribeUserLeft = subscribe('user_left', (payload: any) => {
      if (payload.roomId === roomId) {
        setOnlineUsers(prev => prev.filter(u => u.userId !== payload.userId));
      }
    });

    return () => {
      unsubscribePresence();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
    };
  }, [isConnected, roomId, subscribe]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('typing', (payload: any) => {
      if (payload.roomId === roomId) {
        setTypingUsers(prev => {
          if (payload.isTyping) {
            // Add user to typing list
            const exists = prev.some(u => u.userId === payload.userId);
            if (exists) return prev;

            return [
              ...prev,
              {
                userId: payload.userId,
                userEmail: payload.userEmail,
              },
            ];
          } else {
            // Remove user from typing list
            return prev.filter(u => u.userId !== payload.userId);
          }
        });
      }
    });

    return unsubscribe;
  }, [isConnected, roomId, subscribe]);

  // Subscribe to read receipts
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('read_receipt', (payload: ReadReceipt) => {
      setReadReceipts(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(payload.messageId) || new Set();
        existing.add(payload.userId);
        newMap.set(payload.messageId, existing);
        return newMap;
      });
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        stopTyping();
      }
    };
  }, [stopTyping]);

  return {
    onlineUsers,
    typingUsers,
    readReceipts,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    markAsRead,
    getReadReceipts,
    isInRoom,
  };
}

export default usePresence;

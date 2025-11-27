// Last Modified: 2025-11-24 02:30
/**
 * useConnectionStatus Hook
 * Provides reactive WebSocket connection status for React components
 */

import { useState, useEffect } from 'react';
import { websocketClient, ConnectionStatus, ConnectionStatusInfo } from '@/lib/websocket/client';

/**
 * React hook for monitoring WebSocket connection status
 *
 * @returns ConnectionStatusInfo object with current connection state
 *
 * @example
 * ```tsx
 * const connectionStatus = useConnectionStatus();
 *
 * if (connectionStatus.status === 'reconnecting') {
 *   return <div>Reconnecting... ({connectionStatus.attempt}/{connectionStatus.maxAttempts})</div>
 * }
 * ```
 */
export function useConnectionStatus(): ConnectionStatusInfo {
  const [statusInfo, setStatusInfo] = useState<ConnectionStatusInfo>({
    status: websocketClient.getConnectionStatus() || 'disconnected'
  });

  useEffect(() => {
    // Handler for connection status changes
    const handleStatusChange = (info: ConnectionStatusInfo) => {
      setStatusInfo(info);
    };

    // Subscribe to connection status events
    const unsubscribe = websocketClient.on('connectionStatus', handleStatusChange);

    // Get initial status
    const state = websocketClient.getConnectionState();
    setStatusInfo({
      status: state.status,
      attempt: state.reconnectAttempts
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return statusInfo;
}

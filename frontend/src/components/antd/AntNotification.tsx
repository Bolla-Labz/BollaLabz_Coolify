// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Notification Component
 * Wraps Ant Design notification API as a utility hook/function
 */

import { notification, type NotificationInstance } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import type { ReactNode } from 'react';

export type NotificationPlacement = 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationConfig {
  /**
   * Notification message (title)
   */
  message: string;

  /**
   * Notification description (body text)
   */
  description?: ReactNode;

  /**
   * Duration in seconds (0 = never auto-close)
   * @default 4.5
   */
  duration?: number;

  /**
   * Placement on screen
   * @default 'topRight'
   */
  placement?: NotificationPlacement;

  /**
   * Custom icon
   */
  icon?: ReactNode;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Callback when notification is closed
   */
  onClose?: () => void;
}

/**
 * Notification API
 *
 * Provides toast-like notifications with better positioning and styling than react-hot-toast.
 * Integrates seamlessly with the BollaLabz design system.
 *
 * @example
 * ```tsx
 * import { AntNotification } from '@/components/antd';
 *
 * // Success notification
 * AntNotification.success({
 *   message: 'Task completed!',
 *   description: 'Your reminder has been set for 3:00 PM',
 * });
 *
 * // Error notification
 * AntNotification.error({
 *   message: 'Failed to save',
 *   description: 'Please check your internet connection and try again.',
 *   duration: 0, // Never auto-close
 * });
 * ```
 */
export const AntNotification = {
  /**
   * Show success notification
   */
  success: (config: NotificationConfig) => {
    notification.success({
      ...config,
      placement: config.placement || 'topRight',
      duration: config.duration ?? 4.5,
    });
  },

  /**
   * Show info notification
   */
  info: (config: NotificationConfig) => {
    notification.info({
      ...config,
      placement: config.placement || 'topRight',
      duration: config.duration ?? 4.5,
    });
  },

  /**
   * Show warning notification
   */
  warning: (config: NotificationConfig) => {
    notification.warning({
      ...config,
      placement: config.placement || 'topRight',
      duration: config.duration ?? 4.5,
    });
  },

  /**
   * Show error notification
   */
  error: (config: NotificationConfig) => {
    notification.error({
      ...config,
      placement: config.placement || 'topRight',
      duration: config.duration ?? 6, // Errors stay longer
    });
  },

  /**
   * Close all notifications
   */
  destroy: () => {
    notification.destroy();
  },

  /**
   * Configure global notification settings
   */
  config: (settings: {
    placement?: NotificationPlacement;
    top?: number;
    bottom?: number;
    duration?: number;
    rtl?: boolean;
  }) => {
    notification.config(settings);
  },
};

/**
 * Notification Provider Component
 * Wrap your app with this to enable themed notifications
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ConfigProvider theme={bollaLabzTheme}>
      {children}
    </ConfigProvider>
  );
};

export default AntNotification;

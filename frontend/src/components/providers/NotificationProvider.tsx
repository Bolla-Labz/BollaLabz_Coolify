// Last Modified: 2025-11-24 16:15
/**
 * Ant Design Notification Provider
 * Replaces toast.ts with a comprehensive notification system featuring:
 * - Success/Error/Warning/Info variants with icons
 * - Persistent important notifications
 * - Action buttons in notifications
 * - Click to expand for details
 * - Queue management for multiple notifications
 * - Mobile: bottom position, swipe to dismiss
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { notification } from 'antd';
import type { NotificationInstance, ArgsProps } from 'antd/es/notification/interface';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Configure notification globally
notification.config({
  placement: 'topRight',
  duration: 4.5,
  maxCount: 3,
  rtl: false,
});

interface NotificationContextType {
  api: NotificationInstance;
  showSuccess: (config: NotificationConfig) => void;
  showError: (config: NotificationConfig) => void;
  showWarning: (config: NotificationConfig) => void;
  showInfo: (config: NotificationConfig) => void;
  showLoading: (config: NotificationConfig) => void;
  showPersistent: (config: NotificationConfig & { type: NotificationType }) => void;
  dismissAll: () => void;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface NotificationConfig {
  message: string;
  description?: string;
  duration?: number;
  onClick?: () => void;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  key?: string;
  details?: string; // Expandable details
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [api, contextHolder] = notification.useNotification();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Configure mobile-specific settings
  React.useEffect(() => {
    if (isMobile) {
      notification.config({
        placement: 'bottomRight',
        bottom: 80, // Above mobile nav
        duration: 3.5, // Shorter on mobile
        maxCount: 2, // Fewer notifications on small screens
      });
    } else {
      notification.config({
        placement: 'topRight',
        top: 24,
        duration: 4.5,
        maxCount: 3,
      });
    }
  }, [isMobile]);

  const createNotification = (
    type: NotificationType,
    config: NotificationConfig
  ): void => {
    const {
      message,
      description,
      duration = type === 'loading' ? 0 : undefined,
      onClick,
      onClose,
      action,
      key,
      details,
    } = config;

    const icons = {
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      loading: <LoadingOutlined style={{ color: '#1890ff' }} />,
    };

    const notificationConfig: ArgsProps = {
      message,
      description,
      duration,
      icon: icons[type],
      key,
      onClick,
      onClose,
      placement: isMobile ? 'bottomRight' : 'topRight',
      className: isMobile ? 'mobile-notification' : undefined,
      style: {
        cursor: onClick || details ? 'pointer' : 'default',
        ...(isMobile && {
          margin: '0 8px 8px 8px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }),
      },
    };

    // Add action button if provided
    if (action) {
      notificationConfig.btn = (
        <button
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            api.destroy(key);
          }}
          className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          style={{
            minHeight: '44px', // Touch target
            minWidth: '44px',
          }}
        >
          {action.label}
        </button>
      );
    }

    // Handle expandable details
    if (details && !description) {
      let expanded = false;
      notificationConfig.onClick = () => {
        if (!expanded) {
          expanded = true;
          api.open({
            ...notificationConfig,
            description: details,
            message: `${message} (expanded)`,
          });
        }
        onClick?.();
      };
    }

    api[type === 'loading' ? 'info' : type](notificationConfig);
  };

  const showSuccess = (config: NotificationConfig) => {
    createNotification('success', config);
  };

  const showError = (config: NotificationConfig) => {
    createNotification('error', config);
  };

  const showWarning = (config: NotificationConfig) => {
    createNotification('warning', config);
  };

  const showInfo = (config: NotificationConfig) => {
    createNotification('info', config);
  };

  const showLoading = (config: NotificationConfig) => {
    createNotification('loading', config);
  };

  const showPersistent = (config: NotificationConfig & { type: NotificationType }) => {
    const { type, ...rest } = config;
    createNotification(type, { ...rest, duration: 0 }); // duration: 0 = persistent
  };

  const dismissAll = () => {
    api.destroy();
  };

  const value: NotificationContextType = {
    api,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showPersistent,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
}

// Utility functions for backward compatibility with toast.ts
export function showSuccess(message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) {
  notification.success({
    message,
    description: options?.description,
    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    btn: options?.action ? (
      <button
        onClick={options.action.onClick}
        className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
      >
        {options.action.label}
      </button>
    ) : undefined,
  });
}

export function showError(message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) {
  notification.error({
    message,
    description: options?.description,
    icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    btn: options?.action ? (
      <button
        onClick={options.action.onClick}
        className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
      >
        {options.action.label}
      </button>
    ) : undefined,
  });
}

export function showWarning(message: string, options?: { description?: string }) {
  notification.warning({
    message,
    description: options?.description,
    icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
  });
}

export function showInfo(message: string, options?: { description?: string }) {
  notification.info({
    message,
    description: options?.description,
    icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  });
}

export function dismissAllToasts() {
  notification.destroy();
}

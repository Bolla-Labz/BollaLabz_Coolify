// Last Modified: 2025-11-24 16:15
/**
 * Ant Design Type Definitions
 * Additional type declarations for BollaLabz Ant Design integration
 */

import type { ReactNode } from 'react';
import type { Dayjs } from 'dayjs';

declare module '@/components/antd' {
  // Re-export all component types
  export type {
    AntDatePickerProps,
    AntTimePickerProps,
    NotificationConfig,
    NotificationPlacement,
    NotificationType,
    AntDrawerProps,
    AntDropdownProps,
    MenuItem,
    MenuItemGroup,
    MenuItemDivider,
    MenuItemType,
    AntStepsProps,
    AntProgressProps,
    AntStatisticProps,
  } from '@/components/antd/index';

  // Utility types
  export type DateValue = Dayjs | null;
  export type TimeValue = Dayjs | null;

  export type NotificationMethod = (config: NotificationConfig) => void;

  export interface NotificationAPI {
    success: NotificationMethod;
    info: NotificationMethod;
    warning: NotificationMethod;
    error: NotificationMethod;
    destroy: () => void;
    config: (settings: {
      placement?: NotificationPlacement;
      top?: number;
      bottom?: number;
      duration?: number;
      rtl?: boolean;
    }) => void;
  }
}

// Extend global CSS module declarations for Ant Design styles
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Ant Design theme token type extensions
declare module 'antd/es/config-provider/context' {
  export interface ThemeConfig {
    token?: {
      colorPrimary?: string;
      colorSuccess?: string;
      colorWarning?: string;
      colorError?: string;
      colorInfo?: string;
      colorTextBase?: string;
      colorBgBase?: string;
      fontFamily?: string;
      fontSize?: number;
      borderRadius?: number;
      // ... other tokens
    };
    components?: {
      [key: string]: Record<string, any>;
    };
    algorithm?: any;
  }
}

export {};

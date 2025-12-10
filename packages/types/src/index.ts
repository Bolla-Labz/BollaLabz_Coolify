/**
 * @repo/types - Shared TypeScript types for BollaLabz
 *
 * This package exports all shared types used across the monorepo
 *
 * Updated: 08 December 2025 20 45 00
 */

// Re-export all API types
export * from './api';

// Re-export all Contact types
export * from './contacts';

// Re-export all Voice Pipeline types
export * from './voice';

// Re-export all Productivity types
export * from './productivity';

// Re-export all Telnyx types
export * from './telnyx';

// Re-export all Twilio types (legacy/compatibility)
export * from './twilio';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;

// Common status types
export type Status = 'idle' | 'loading' | 'success' | 'error';

// Common sorting
export type SortOrder = 'asc' | 'desc';

// Timestamps
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// Soft delete
export interface SoftDeletable {
  deletedAt?: string | null;
  isDeleted?: boolean;
}

// User reference
export interface UserRef {
  userId: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

// Generic ID type
export type ID = string;

// Environment
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Feature flags
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  userGroups?: string[];
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'task'
  | 'event'
  | 'call'
  | 'message';

// User preferences
export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  taskReminders: boolean;
  eventReminders: boolean;
  callNotifications: boolean;
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  shareUsageData: boolean;
  publicProfile: boolean;
}

// Audit log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Export utility type helpers
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

export type ValueOf<T> = T[keyof T];

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];
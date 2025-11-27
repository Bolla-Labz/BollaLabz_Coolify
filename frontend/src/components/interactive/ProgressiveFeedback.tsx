// Last Modified: 2025-11-24 16:15
/**
 * Progressive Feedback Indicators
 * User feedback components for operations and status
 * - FileUploadProgress: Progress bar for uploads with Ant Progress
 * - CircularProgress: Circular indicator for actions
 * - StepProgress: Multi-step operation tracking
 * - BackgroundSyncIndicator: Background operation status
 * - NetworkStatus: Connection awareness
 * - OfflineMode: Offline mode notifications
 */

import React, { useEffect, useState } from 'react';
import { Progress } from 'antd';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Cloud, CloudOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/components/providers/NotificationProvider';

// ============================================================================
// File Upload Progress with Ant Design Progress
// ============================================================================

interface FileUploadProgressProps {
  fileName: string;
  progress: number; // 0-100
  status?: 'active' | 'success' | 'exception';
  onCancel?: () => void;
}

export function FileUploadProgress({
  fileName,
  progress,
  status = 'active',
  onCancel,
}: FileUploadProgressProps) {
  return (
    <div className="space-y-2 p-4 rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate flex-1">{fileName}</span>
        {onCancel && status === 'active' && (
          <button
            onClick={onCancel}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
      <Progress
        percent={progress}
        status={status}
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        trailColor="rgba(0, 0, 0, 0.06)"
      />
      <div className="text-xs text-muted-foreground">
        {status === 'active' && `${progress}% uploaded`}
        {status === 'success' && 'Upload complete'}
        {status === 'exception' && 'Upload failed'}
      </div>
    </div>
  );
}

// ============================================================================
// Circular Progress for Actions
// ============================================================================

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  status?: 'normal' | 'success' | 'exception';
  label?: string;
}

export function CircularProgress({
  percent,
  size = 80,
  strokeWidth = 6,
  status = 'normal',
  label,
}: CircularProgressProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Progress
        type="circle"
        percent={percent}
        size={size}
        strokeWidth={strokeWidth}
        status={status === 'normal' ? undefined : status}
        format={(percent) => `${percent}%`}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

// ============================================================================
// Step Progress for Multi-Part Operations
// ============================================================================

interface StepProgressProps {
  steps: Array<{
    title: string;
    description?: string;
    status: 'wait' | 'process' | 'finish' | 'error';
  }>;
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = step.status === 'finish';
        const hasError = step.status === 'error';

        return (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-all',
              isActive && 'bg-primary/5 border border-primary/20',
              isCompleted && 'opacity-75'
            )}
          >
            {/* Step indicator */}
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                'border-2 transition-all',
                isCompleted && 'bg-green-500 border-green-500 text-white',
                hasError && 'bg-red-500 border-red-500 text-white',
                isActive && !hasError && 'border-primary bg-primary/10',
                !isActive && !isCompleted && !hasError && 'border-border bg-background'
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : hasError ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  'text-sm font-medium',
                  isActive && 'text-foreground',
                  !isActive && 'text-muted-foreground'
                )}
              >
                {step.title}
              </h4>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              )}
              {isActive && step.status === 'process' && (
                <Progress
                  percent={100}
                  status="active"
                  showInfo={false}
                  className="mt-2"
                  size="small"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Background Sync Indicator
// ============================================================================

interface BackgroundSyncIndicatorProps {
  isSyncing: boolean;
  lastSyncTime?: Date;
}

export function BackgroundSyncIndicator({ isSyncing, lastSyncTime }: BackgroundSyncIndicatorProps) {
  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isSyncing ? (
        <>
          <Cloud className="w-4 h-4 animate-pulse" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <Cloud className="w-4 h-4" />
          <span>
            {lastSyncTime ? `Synced ${getTimeSince(lastSyncTime)}` : 'Not synced'}
          </span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Network Status Awareness
// ============================================================================

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);
  const { showWarning, showInfo } = useNotifications();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
      showInfo({ message: 'Back online', description: 'Connection restored' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
      showWarning({
        message: 'No internet connection',
        description: 'Some features may be limited',
        duration: 0, // Persistent until online
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showWarning, showInfo]);

  if (!showOffline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-40">
      <div className="bg-yellow-500 text-yellow-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">You're offline</p>
          <p className="text-xs opacity-90">Check your internet connection</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Offline Mode Banner
// ============================================================================

interface OfflineModeBannerProps {
  onRetry?: () => void;
}

export function OfflineModeBanner({ onRetry }: OfflineModeBannerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <CloudOff className="w-4 h-4" />
        <span>Offline mode - Changes will sync when connection is restored</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs bg-destructive-foreground text-destructive rounded-md hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton with Progress
// ============================================================================

interface LoadingSkeletonWithProgressProps {
  progress?: number;
  text?: string;
}

export function LoadingSkeletonWithProgress({ progress, text }: LoadingSkeletonWithProgressProps) {
  return (
    <div className="space-y-3 p-6">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      {progress !== undefined && (
        <div className="pt-4">
          <Progress percent={progress} size="small" />
          {text && <p className="text-xs text-muted-foreground mt-2">{text}</p>}
        </div>
      )}
    </div>
  );
}

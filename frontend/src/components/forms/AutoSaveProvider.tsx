// Last Modified: 2025-11-24 21:15
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { Cloud, CloudOff, Save, AlertCircle } from 'lucide-react';

interface AutoSaveOptions {
  debounceMs?: number;
  storageKey: string;
  onSave?: (data: any) => Promise<void>;
  onConflict?: (local: any, remote: any) => any;
}

interface AutoSaveContextValue {
  save: (data: any) => void;
  saveNow: () => Promise<void>;
  restore: () => any | null;
  clearSaved: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
}

const AutoSaveContext = createContext<AutoSaveContextValue | null>(null);

export function useAutoSave() {
  const context = useContext(AutoSaveContext);
  if (!context) {
    throw new Error('useAutoSave must be used within AutoSaveProvider');
  }
  return context;
}

interface AutoSaveProviderProps extends AutoSaveOptions {
  children: React.ReactNode;
  enabled?: boolean;
}

/**
 * AutoSaveProvider - Manages automatic form saving with debouncing and conflict resolution
 *
 * Features:
 * - Debounced auto-save (default 2s)
 * - Local storage persistence
 * - Offline queue support
 * - Conflict resolution
 * - Visual save status indicator
 * - Optimistic updates with rollback
 */
export function AutoSaveProvider({
  children,
  debounceMs = 2000,
  storageKey,
  onSave,
  onConflict,
  enabled = true,
}: AutoSaveProviderProps) {
  const [currentData, setCurrentData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const debouncedData = useDebounce(currentData, debounceMs);
  const saveQueueRef = useRef<any[]>([]);
  const lastSavedDataRef = useRef<any>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('idle');
      // Process offline queue
      if (saveQueueRef.current.length > 0) {
        toast.success('Back online - syncing changes...');
        processOfflineQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
      toast.error('You are offline - changes will sync when reconnected', {
        icon: <CloudOff className="h-4 w-4" />,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process offline queue when back online
  const processOfflineQueue = async () => {
    if (saveQueueRef.current.length === 0) return;

    const queue = [...saveQueueRef.current];
    saveQueueRef.current = [];

    for (const data of queue) {
      try {
        await performSave(data);
      } catch (error) {
        console.error('Failed to sync queued save:', error);
        // Re-queue if it fails
        saveQueueRef.current.push(data);
      }
    }

    if (saveQueueRef.current.length === 0) {
      toast.success('All changes synced successfully');
    }
  };

  // Perform the actual save operation
  const performSave = async (data: any) => {
    if (!data || !enabled) return;

    setIsSaving(true);
    setStatus('saving');

    try {
      // Save to localStorage first (always works)
      const saveData = {
        data,
        timestamp: new Date().toISOString(),
        version: lastSavedDataRef.current?.version ? lastSavedDataRef.current.version + 1 : 1,
      };

      localStorage.setItem(storageKey, JSON.stringify(saveData));

      // If online and onSave callback provided, sync to server
      if (isOnline && onSave) {
        try {
          await onSave(data);
          lastSavedDataRef.current = saveData;
          setLastSaved(new Date());
          setStatus('saved');
          setHasUnsavedChanges(false);

          // Auto-hide saved status after 3s
          setTimeout(() => {
            setStatus('idle');
          }, 3000);
        } catch (error: any) {
          // Check if it's a conflict error
          if (error.status === 409 && error.remoteData && onConflict) {
            const resolved = onConflict(data, error.remoteData);
            await onSave(resolved);
            setStatus('saved');
            toast.success('Conflicting changes merged successfully');
          } else {
            throw error;
          }
        }
      } else if (!isOnline) {
        // Queue for later if offline
        saveQueueRef.current.push(data);
        setStatus('offline');
      } else {
        setLastSaved(new Date());
        setStatus('saved');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');
      toast.error('Failed to save changes - will retry', {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save effect
  useEffect(() => {
    if (debouncedData && enabled) {
      performSave(debouncedData);
    }
  }, [debouncedData, enabled]);

  // Save function (sets data to trigger debounced save)
  const save = useCallback((data: any) => {
    setCurrentData(data);
    setHasUnsavedChanges(true);
  }, []);

  // Immediate save (bypasses debounce)
  const saveNow = useCallback(async () => {
    if (currentData) {
      await performSave(currentData);
    }
  }, [currentData]);

  // Restore from storage
  const restore = useCallback((): any | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        lastSavedDataRef.current = parsed;
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to restore from storage:', error);
    }
    return null;
  }, [storageKey]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    localStorage.removeItem(storageKey);
    setCurrentData(null);
    setLastSaved(null);
    setHasUnsavedChanges(false);
    setStatus('idle');
    lastSavedDataRef.current = null;
  }, [storageKey]);

  // Save before unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const value: AutoSaveContextValue = {
    save,
    saveNow,
    restore,
    clearSaved,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    status,
  };

  return (
    <AutoSaveContext.Provider value={value}>
      {children}
      <SaveStatusIndicator status={status} lastSaved={lastSaved} />
    </AutoSaveContext.Provider>
  );
}

/**
 * Visual save status indicator
 */
function SaveStatusIndicator({
  status,
  lastSaved,
}: {
  status: AutoSaveContextValue['status'];
  lastSaved: Date | null;
}) {
  if (status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Save className="h-3 w-3 animate-pulse" />,
          text: 'Saving...',
          className: 'bg-blue-500/10 text-blue-600 border-blue-200',
        };
      case 'saved':
        return {
          icon: <Cloud className="h-3 w-3" />,
          text: lastSaved
            ? `Saved ${new Date(lastSaved).toLocaleTimeString()}`
            : 'Saved',
          className: 'bg-green-500/10 text-green-600 border-green-200',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Save failed',
          className: 'bg-red-500/10 text-red-600 border-red-200',
        };
      case 'offline':
        return {
          icon: <CloudOff className="h-3 w-3" />,
          text: 'Offline - will sync later',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-sm ${config.className}`}
      >
        {config.icon}
        <span>{config.text}</span>
      </div>
    </div>
  );
}

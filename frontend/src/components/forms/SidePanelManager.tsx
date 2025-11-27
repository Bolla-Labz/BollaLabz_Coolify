// Last Modified: 2025-11-24 21:20
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Panel {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  position?: 'left' | 'right';
  onClose?: () => void;
}

interface SidePanelContextValue {
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
  closeAllPanels: () => void;
  goBack: () => void;
  activePanels: Panel[];
  currentPanel: Panel | null;
}

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function useSidePanel() {
  const context = useContext(SidePanelContext);
  if (!context) {
    throw new Error('useSidePanel must be used within SidePanelManager');
  }
  return context;
}

interface SidePanelManagerProps {
  children: React.ReactNode;
  maxStackDepth?: number;
}

/**
 * SidePanelManager - Manages stacked side panel/drawer operations
 *
 * Features:
 * - Multi-level drawers for nested operations
 * - Responsive drawer sizes (S/M/L/XL/Full)
 * - Keyboard navigation (Escape to close, Back to previous)
 * - Focus management for accessibility
 * - Stacked drawer support
 * - Left or right positioning
 */
export function SidePanelManager({
  children,
  maxStackDepth = 3,
}: SidePanelManagerProps) {
  const [panelStack, setPanelStack] = useState<Panel[]>([]);

  const openPanel = useCallback(
    (panel: Panel) => {
      setPanelStack((prev) => {
        // Prevent infinite stacking
        if (prev.length >= maxStackDepth) {
          return [...prev.slice(1), panel];
        }
        return [...prev, panel];
      });
    },
    [maxStackDepth]
  );

  const closePanel = useCallback(() => {
    setPanelStack((prev) => prev.slice(0, -1));
  }, []);

  const closeAllPanels = useCallback(() => {
    setPanelStack([]);
  }, []);

  const goBack = useCallback(() => {
    setPanelStack((prev) => prev.slice(0, -1));
  }, []);

  const currentPanel = panelStack[panelStack.length - 1] || null;

  const value: SidePanelContextValue = {
    openPanel,
    closePanel,
    closeAllPanels,
    goBack,
    activePanels: panelStack,
    currentPanel,
  };

  return (
    <SidePanelContext.Provider value={value}>
      {children}

      {/* Render stacked panels */}
      {panelStack.map((panel, index) => {
        const isActive = index === panelStack.length - 1;
        const zIndex = 50 + index;

        return (
          <Drawer
            key={panel.id}
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                if (isActive) {
                  closePanel();
                  panel.onClose?.();
                }
              }
            }}
          >
            <DrawerContent
              position={panel.position || 'right'}
              size={panel.size || 'default'}
              className={cn('overflow-y-auto', !isActive && 'opacity-50')}
              style={{ zIndex }}
            >
              <DrawerHeader>
                {/* Back button for stacked panels */}
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goBack}
                    className="w-fit mb-2"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}

                <DrawerTitle>{panel.title}</DrawerTitle>
                {panel.description && (
                  <DrawerDescription>{panel.description}</DrawerDescription>
                )}
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {panel.content}
              </div>
            </DrawerContent>
          </Drawer>
        );
      })}
    </SidePanelContext.Provider>
  );
}

/**
 * Quick Edit Panel - Convenience component for edit operations
 */
interface QuickEditPanelProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void | Promise<void>;
  onCancel?: () => void;
  saveLabel?: string;
  size?: Panel['size'];
}

export function QuickEditPanel({
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = 'Save Changes',
  size = 'default',
}: QuickEditPanelProps) {
  const { openPanel, closePanel } = useSidePanel();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      closePanel();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    closePanel();
  };

  return (
    <div className="space-y-4">
      {children}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : saveLabel}
        </Button>
      </div>
    </div>
  );
}

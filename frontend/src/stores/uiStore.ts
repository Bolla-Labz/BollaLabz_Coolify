// Last Modified: 2025-11-24 12:27
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

interface Modal {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'custom';
  title?: string;
  content: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Mobile
  isMobileNavOpen: boolean;

  // Modals
  modals: Modal[];

  // Toasts
  toasts: Toast[];

  // Command Palette
  isCommandPaletteOpen: boolean;

  // Search
  isSearchOpen: boolean;
  searchQuery: string;

  // Loading States
  globalLoading: boolean;
  loadingMessage?: string;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Actions - Mobile
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;

  // Actions - Modals
  showModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Actions - Toasts
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;

  // Actions - Command Palette
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Actions - Search
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;

  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Utility Actions
  showSuccessToast: (title: string, description?: string) => void;
  showErrorToast: (title: string, description?: string) => void;
  showConfirmModal: (
    title: string,
    content: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
      // Initial state
      isSidebarOpen: true,
      isSidebarCollapsed: false,
      isMobileNavOpen: false,
      modals: [],
      toasts: [],
      isCommandPaletteOpen: false,
      isSearchOpen: false,
      searchQuery: '',
      globalLoading: false,
      loadingMessage: undefined,

      // Actions - Sidebar
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      toggleSidebarCollapse: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      // Actions - Mobile
      toggleMobileNav: () =>
        set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),

      setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),

      // Actions - Modals
      showModal: (modal) =>
        set((state) => ({
          modals: [
            ...state.modals,
            {
              ...modal,
              id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
          ],
        })),

      closeModal: (id) =>
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id),
        })),

      closeAllModals: () => set({ modals: [] }),

      // Actions - Toasts
      showToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duration = toast.duration ?? 5000;

        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              ...toast,
              id,
              duration,
            },
          ],
        }));

        // Auto dismiss after duration
        if (duration > 0) {
          setTimeout(() => {
            get().dismissToast(id);
          }, duration);
        }
      },

      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      dismissAllToasts: () => set({ toasts: [] }),

      // Actions - Command Palette
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

      // Actions - Search
      toggleSearch: () =>
        set((state) => ({ isSearchOpen: !state.isSearchOpen })),

      setSearchOpen: (open) => set({ isSearchOpen: open }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      // Actions - Loading
      setGlobalLoading: (loading, message) =>
        set({
          globalLoading: loading,
          loadingMessage: message,
        }),

      // Utility Actions
      showSuccessToast: (title, description) => {
        get().showToast({
          type: 'success',
          title,
          description,
        });
      },

      showErrorToast: (title, description) => {
        get().showToast({
          type: 'error',
          title,
          description,
          duration: 8000, // Errors stay longer
        });
      },

      showConfirmModal: (title, content, onConfirm, onCancel) => {
        get().showModal({
          type: 'warning',
          title,
          content,
          actions: [
            {
              label: 'Cancel',
              onClick: () => {
                const modals = get().modals;
                const modal = modals[modals.length - 1];
                if (modal) {
                  get().closeModal(modal.id);
                }
                onCancel?.();
              },
              variant: 'outline',
            },
            {
              label: 'Confirm',
              onClick: () => {
                const modals = get().modals;
                const modal = modals[modals.length - 1];
                if (modal) {
                  get().closeModal(modal.id);
                }
                onConfirm();
              },
              variant: 'destructive',
            },
          ],
        });
      },
      }),
      {
        name: 'ui-store',
      }
    )
  )
);
// Last Modified: 2025-11-23 17:30
/**
 * Data Store (Generic Table State Management)
 *
 * Provides generic state management for data tables including:
 * - Filtering, sorting, and pagination
 * - Row selection and bulk operations
 * - Search and column visibility
 * - Export and import functionality
 * - Reusable across all data table components
 */

import { create } from 'zustand';
import {
  SortConfig,
  PaginationConfig,
  FilterConfig,
} from '@/types/table';

interface DataStoreState<T = any> {
  // Table State
  data: T[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;

  // Selection
  selectedRows: Set<string>;
  selectAll: boolean;

  // Sorting
  sortConfig: SortConfig<T>;

  // Pagination
  pagination: PaginationConfig;

  // Filters
  filters: FilterConfig;
  searchQuery: string;

  // Column Visibility
  hiddenColumns: Set<string>;

  // Actions - Data Management
  setData: (data: T[], totalItems: number) => void;
  appendData: (data: T[]) => void;
  clearData: () => void;

  // Actions - Selection
  selectRow: (rowId: string) => void;
  deselectRow: (rowId: string) => void;
  toggleRow: (rowId: string) => void;
  selectAllRows: (rowIds: string[]) => void;
  deselectAllRows: () => void;
  toggleSelectAll: (rowIds: string[]) => void;
  getSelectedRowIds: () => string[];

  // Actions - Sorting
  setSort: (key: keyof T | null, direction?: 'asc' | 'desc' | null) => void;
  toggleSort: (key: keyof T) => void;
  clearSort: () => void;

  // Actions - Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;

  // Actions - Filters
  setFilter: (key: string, value: string | string[] | number | boolean | null) => void;
  setFilters: (filters: FilterConfig) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  setSearch: (query: string) => void;

  // Actions - Column Visibility
  hideColumn: (columnKey: string) => void;
  showColumn: (columnKey: string) => void;
  toggleColumn: (columnKey: string) => void;
  resetColumnVisibility: () => void;

  // Actions - Loading & Error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Utility
  reset: () => void;

  // Selectors (Derived State)
  hasSelection: () => boolean;
  getSelectedCount: () => number;
  isRowSelected: (rowId: string) => boolean;
  hasFilters: () => boolean;
  getTotalPages: () => number;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
}

const defaultPagination: PaginationConfig = {
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

const defaultSortConfig: SortConfig<any> = {
  key: null,
  direction: null,
};

export const createDataStore = <T = any>() => {
  return create<DataStoreState<T>>((set, get) => ({
    // Default State
    data: [],
    totalItems: 0,
    isLoading: false,
    error: null,
    selectedRows: new Set<string>(),
    selectAll: false,
    sortConfig: defaultSortConfig,
    pagination: defaultPagination,
    filters: {},
    searchQuery: '',
    hiddenColumns: new Set<string>(),

    // ============================================================================
    // Data Management Actions
    // ============================================================================

    setData: (data: T[], totalItems: number): void => {
      set({
        data,
        totalItems,
        pagination: {
          ...get().pagination,
          totalItems,
          totalPages: Math.ceil(totalItems / get().pagination.pageSize),
        },
      });
    },

    appendData: (data: T[]): void => {
      set((state) => ({
        data: [...state.data, ...data],
      }));
    },

    clearData: (): void => {
      set({
        data: [],
        totalItems: 0,
        pagination: defaultPagination,
      });
    },

    // ============================================================================
    // Selection Actions
    // ============================================================================

    selectRow: (rowId: string): void => {
      set((state) => {
        const newSelection = new Set(state.selectedRows);
        newSelection.add(rowId);
        return { selectedRows: newSelection };
      });
    },

    deselectRow: (rowId: string): void => {
      set((state) => {
        const newSelection = new Set(state.selectedRows);
        newSelection.delete(rowId);
        return { selectedRows: newSelection, selectAll: false };
      });
    },

    toggleRow: (rowId: string): void => {
      const isSelected = get().isRowSelected(rowId);
      if (isSelected) {
        get().deselectRow(rowId);
      } else {
        get().selectRow(rowId);
      }
    },

    selectAllRows: (rowIds: string[]): void => {
      set({
        selectedRows: new Set(rowIds),
        selectAll: true,
      });
    },

    deselectAllRows: (): void => {
      set({
        selectedRows: new Set<string>(),
        selectAll: false,
      });
    },

    toggleSelectAll: (rowIds: string[]): void => {
      const { selectAll } = get();
      if (selectAll) {
        get().deselectAllRows();
      } else {
        get().selectAllRows(rowIds);
      }
    },

    getSelectedRowIds: (): string[] => {
      return Array.from(get().selectedRows);
    },

    // ============================================================================
    // Sorting Actions
    // ============================================================================

    setSort: (key: keyof T | null, direction?: 'asc' | 'desc' | null): void => {
      set({
        sortConfig: {
          key,
          direction: direction || (key ? 'asc' : null),
        },
      });
    },

    toggleSort: (key: keyof T): void => {
      const { sortConfig } = get();

      if (sortConfig.key === key) {
        // Toggle direction: asc -> desc -> null
        const newDirection =
          sortConfig.direction === 'asc'
            ? 'desc'
            : sortConfig.direction === 'desc'
            ? null
            : 'asc';

        set({
          sortConfig: {
            key: newDirection ? key : null,
            direction: newDirection,
          },
        });
      } else {
        // New column, start with asc
        set({
          sortConfig: {
            key,
            direction: 'asc',
          },
        });
      }
    },

    clearSort: (): void => {
      set({ sortConfig: defaultSortConfig });
    },

    // ============================================================================
    // Pagination Actions
    // ============================================================================

    setPage: (page: number): void => {
      set((state) => ({
        pagination: {
          ...state.pagination,
          currentPage: Math.max(1, Math.min(page, state.pagination.totalPages)),
        },
      }));
    },

    setPageSize: (pageSize: number): void => {
      set((state) => ({
        pagination: {
          ...state.pagination,
          pageSize,
          currentPage: 1, // Reset to first page
          totalPages: Math.ceil(state.totalItems / pageSize),
        },
      }));
    },

    nextPage: (): void => {
      const { pagination } = get();
      if (get().canGoNext()) {
        get().setPage(pagination.currentPage + 1);
      }
    },

    previousPage: (): void => {
      const { pagination } = get();
      if (get().canGoPrevious()) {
        get().setPage(pagination.currentPage - 1);
      }
    },

    goToFirstPage: (): void => {
      get().setPage(1);
    },

    goToLastPage: (): void => {
      const { pagination } = get();
      get().setPage(pagination.totalPages);
    },

    // ============================================================================
    // Filter Actions
    // ============================================================================

    setFilter: (key: string, value: string | string[] | number | boolean | null): void => {
      set((state) => ({
        filters: {
          ...state.filters,
          [key]: value,
        },
        pagination: {
          ...state.pagination,
          currentPage: 1, // Reset to first page when filtering
        },
      }));
    },

    setFilters: (filters: FilterConfig): void => {
      set({
        filters,
        pagination: {
          ...get().pagination,
          currentPage: 1,
        },
      });
    },

    clearFilter: (key: string): void => {
      set((state) => {
        const newFilters = { ...state.filters };
        delete newFilters[key];
        return { filters: newFilters };
      });
    },

    clearAllFilters: (): void => {
      set({
        filters: {},
        searchQuery: '',
        pagination: {
          ...get().pagination,
          currentPage: 1,
        },
      });
    },

    setSearch: (query: string): void => {
      set({
        searchQuery: query,
        pagination: {
          ...get().pagination,
          currentPage: 1, // Reset to first page when searching
        },
      });
    },

    // ============================================================================
    // Column Visibility Actions
    // ============================================================================

    hideColumn: (columnKey: string): void => {
      set((state) => {
        const newHidden = new Set(state.hiddenColumns);
        newHidden.add(columnKey);
        return { hiddenColumns: newHidden };
      });
    },

    showColumn: (columnKey: string): void => {
      set((state) => {
        const newHidden = new Set(state.hiddenColumns);
        newHidden.delete(columnKey);
        return { hiddenColumns: newHidden };
      });
    },

    toggleColumn: (columnKey: string): void => {
      const { hiddenColumns } = get();
      if (hiddenColumns.has(columnKey)) {
        get().showColumn(columnKey);
      } else {
        get().hideColumn(columnKey);
      }
    },

    resetColumnVisibility: (): void => {
      set({ hiddenColumns: new Set<string>() });
    },

    // ============================================================================
    // Loading & Error Actions
    // ============================================================================

    setLoading: (isLoading: boolean): void => {
      set({ isLoading });
    },

    setError: (error: string | null): void => {
      set({ error });
    },

    // ============================================================================
    // Utility Actions
    // ============================================================================

    reset: (): void => {
      set({
        data: [],
        totalItems: 0,
        isLoading: false,
        error: null,
        selectedRows: new Set<string>(),
        selectAll: false,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination,
        filters: {},
        searchQuery: '',
        hiddenColumns: new Set<string>(),
      });
    },

    // ============================================================================
    // Selectors (Derived State)
    // ============================================================================

    hasSelection: (): boolean => {
      return get().selectedRows.size > 0;
    },

    getSelectedCount: (): number => {
      return get().selectedRows.size;
    },

    isRowSelected: (rowId: string): boolean => {
      return get().selectedRows.has(rowId);
    },

    hasFilters: (): boolean => {
      const { filters, searchQuery } = get();
      return Object.keys(filters).length > 0 || searchQuery !== '';
    },

    getTotalPages: (): number => {
      return get().pagination.totalPages;
    },

    canGoNext: (): boolean => {
      const { pagination } = get();
      return pagination.currentPage < pagination.totalPages;
    },

    canGoPrevious: (): boolean => {
      const { pagination } = get();
      return pagination.currentPage > 1;
    },
  }));
};

// Create default instance for general use
export const useDataStore = createDataStore();

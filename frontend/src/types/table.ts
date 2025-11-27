// Last Modified: 2025-11-23 17:30
/**
 * Table Type Definitions
 *
 * Generic types for data tables, sorting, filtering, and pagination
 */

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = any> {
  field: keyof T | string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface FilterConfig {
  [key: string]: any;
}

export interface TableColumn<T = any> {
  id: string;
  label: string;
  field: keyof T | string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableState<T = any> {
  data: T[];
  sortConfig: SortConfig<T>;
  pagination: PaginationConfig;
  filters: FilterConfig;
  selectedRows: Set<string>;
  isLoading: boolean;
  error: string | null;
}

export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  onClick: (selectedRows: any[]) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

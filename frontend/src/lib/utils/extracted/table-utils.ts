// Last Modified: 2025-11-23 17:30
/**
 * Utility functions for table operations
 */

import { SortConfig, SortDirection } from "@/types/table";

/**
 * Sort an array of objects by a specific key
 */
export function sortData<T>(
  data: T[],
  sortConfig: SortConfig<T>
): T[] {
  if (!sortConfig.key || !sortConfig.direction) {
    return data;
  }

  const sorted = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof T];
    const bValue = b[sortConfig.key as keyof T];

    // Handle null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Handle different types
    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return aValue - bValue;
    }

    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return aValue.getTime() - bValue.getTime();
    }

    // Fallback to string comparison
    return String(aValue).localeCompare(String(bValue));
  });

  return sortConfig.direction === "desc" ? sorted.reverse() : sorted;
}

/**
 * Toggle sort direction for a column
 */
export function toggleSortDirection(
  currentKey: string | null,
  currentDirection: SortDirection,
  newKey: string
): SortDirection {
  if (currentKey !== newKey) {
    // New column selected, default to ascending
    return "asc";
  }

  // Same column, cycle through: asc -> desc -> null
  if (currentDirection === "asc") return "desc";
  if (currentDirection === "desc") return null;
  return "asc";
}

/**
 * Paginate an array of data
 */
export function paginateData<T>(
  data: T[],
  currentPage: number,
  pageSize: number
): T[] {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(
  totalItems: number,
  pageSize: number
): number {
  return Math.ceil(totalItems / pageSize);
}

/**
 * Filter data by search query across multiple fields
 */
export function filterBySearch<T>(
  data: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchQuery.trim()) {
    return data;
  }

  const query = searchQuery.toLowerCase();

  return data.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(query);
    })
  );
}

/**
 * Filter data by specific filters
 */
export function filterData<T>(
  data: T[],
  filters: Record<string, any>
): T[] {
  return data.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (value == null || value === "" || value === "all") {
        return true;
      }

      const itemValue = item[key as keyof T];

      // Handle array filters (multiple selection)
      if (Array.isArray(value)) {
        return value.length === 0 || value.includes(itemValue);
      }

      // Handle single value
      return itemValue === value;
    })
  );
}

/**
 * Get unique values for a field (for filter dropdowns)
 */
export function getUniqueValues<T>(
  data: T[],
  field: keyof T
): string[] {
  const values = data
    .map((item) => item[field])
    .filter((value) => value != null)
    .map((value) => String(value));

  return Array.from(new Set(values)).sort();
}

/**
 * Generate a stable row ID from an object
 */
export function generateRowId<T extends Record<string, any>>(
  row: T,
  idField: keyof T = "id" as keyof T
): string {
  if (row[idField]) {
    return String(row[idField]);
  }

  // Fallback: hash the entire object
  return JSON.stringify(row);
}

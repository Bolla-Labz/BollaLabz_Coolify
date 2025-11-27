// Last Modified: 2025-11-24 00:00
import { useState, useMemo, useDeferredValue } from 'react';

/**
 * Custom hook that implements React 18's useDeferredValue for search operations
 * Provides smooth, non-blocking filtering for large datasets
 *
 * @template T - The type of items being searched
 * @param items - Array of items to search through
 * @param searchTerm - Current search term from user input
 * @param searchFields - Array of field names to search within each item
 * @param customFilter - Optional custom filter function for advanced filtering
 * @returns Object containing filtered results and pending state
 */
export function useSearchWithDefer<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  customFilter?: (item: T, deferredTerm: string) => boolean
): {
  results: T[];
  isPending: boolean;
  deferredTerm: string;
} {
  // Defer the search term to keep input responsive
  const deferredTerm = useDeferredValue(searchTerm);

  // Check if we're waiting for deferred value to catch up
  const isPending = searchTerm !== deferredTerm;

  // Memoize filtered results based on deferred term
  const results = useMemo(() => {
    // If no search term, return all items
    if (!deferredTerm.trim()) {
      return items;
    }

    const lowerCaseTerm = deferredTerm.toLowerCase();

    // Use custom filter if provided, otherwise use default field-based search
    return items.filter((item) => {
      if (customFilter) {
        return customFilter(item, deferredTerm);
      }

      // Default: search across specified fields
      return searchFields.some((field) => {
        const value = item[field];

        // Handle different value types
        if (value === null || value === undefined) {
          return false;
        }

        // Handle arrays (like tags)
        if (Array.isArray(value)) {
          return value.some(v =>
            String(v).toLowerCase().includes(lowerCaseTerm)
          );
        }

        // Handle objects (convert to string)
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(lowerCaseTerm);
        }

        // Handle primitive values
        return String(value).toLowerCase().includes(lowerCaseTerm);
      });
    });
  }, [items, deferredTerm, searchFields, customFilter]);

  return {
    results,
    isPending,
    deferredTerm
  };
}

/**
 * Variant hook for multi-criteria filtering with deferred updates
 * Useful for complex filter objects (priority, status, tags, etc.)
 */
export function useFilterWithDefer<T, F extends Record<string, any>>(
  items: T[],
  filters: F,
  filterFunction: (item: T, deferredFilters: F) => boolean
): {
  results: T[];
  isPending: boolean;
  deferredFilters: F;
} {
  const deferredFilters = useDeferredValue(filters);
  const isPending = JSON.stringify(filters) !== JSON.stringify(deferredFilters);

  const results = useMemo(() => {
    return items.filter(item => filterFunction(item, deferredFilters));
  }, [items, deferredFilters, filterFunction]);

  return {
    results,
    isPending,
    deferredFilters
  };
}

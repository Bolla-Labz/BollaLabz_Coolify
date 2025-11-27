// Last Modified: 2025-11-24 16:52
/**
 * FuseSearchProvider - Fuzzy search service for BollaLabz
 *
 * Philosophy: "Zero Cognitive Load" - Find what you need with typos, partial matches,
 * and intelligent ranking. Search should feel magical, not frustrating.
 *
 * Features:
 * - Fuzzy matching with 2-letter typo tolerance
 * - Multi-field search across contacts, conversations, tasks, events
 * - Field-specific search (name:john, tag:urgent)
 * - Performance-optimized with <50ms response time
 * - Boolean operators (AND, OR, NOT)
 * - Quoted exact phrases
 */

import Fuse from 'fuse.js';

/**
 * Configuration for different data types
 * Each config optimized for its specific use case
 */
const SEARCH_CONFIGS = {
  contacts: {
    threshold: 0.3, // Lower = stricter matching (0.3 allows ~2 letter typos)
    keys: [
      { name: 'name', weight: 2.0 }, // Name is most important
      { name: 'email', weight: 1.5 },
      { name: 'phone', weight: 1.5 },
      { name: 'company', weight: 1.0 },
      { name: 'notes', weight: 0.8 },
      { name: 'tags', weight: 1.2 },
    ],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    useExtendedSearch: true, // Enable field-specific search
    ignoreLocation: true, // Don't weight by position in string
  },

  conversations: {
    threshold: 0.35,
    keys: [
      { name: 'contact_name', weight: 2.0 },
      { name: 'last_message', weight: 1.5 },
      { name: 'messages', weight: 1.0 },
      { name: 'tags', weight: 1.2 },
    ],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    useExtendedSearch: true,
    ignoreLocation: true,
  },

  tasks: {
    threshold: 0.3,
    keys: [
      { name: 'title', weight: 2.0 },
      { name: 'description', weight: 1.5 },
      { name: 'assignee', weight: 1.2 },
      { name: 'tags', weight: 1.2 },
      { name: 'status', weight: 1.0 },
      { name: 'priority', weight: 1.0 },
    ],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    useExtendedSearch: true,
    ignoreLocation: true,
  },

  events: {
    threshold: 0.3,
    keys: [
      { name: 'title', weight: 2.0 },
      { name: 'description', weight: 1.5 },
      { name: 'location', weight: 1.2 },
      { name: 'attendees', weight: 1.0 },
    ],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    useExtendedSearch: true,
    ignoreLocation: true,
  },

  // Global search across all types
  global: {
    threshold: 0.4, // Slightly more permissive for global search
    keys: [
      { name: 'type', weight: 0.5 }, // Category identification
      { name: 'title', weight: 2.0 },
      { name: 'content', weight: 1.5 },
      { name: 'metadata', weight: 0.8 },
    ],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    useExtendedSearch: true,
    ignoreLocation: true,
  },
};

/**
 * Search result type with highlighting information
 */
export interface SearchResult<T = any> {
  item: T;
  score: number;
  matches?: Fuse.FuseResultMatch[];
  indices?: readonly [number, number][];
}

/**
 * Search options for fine-tuned control
 */
export interface SearchOptions {
  limit?: number;
  threshold?: number;
  sortBy?: 'relevance' | 'recent' | 'alphabetical';
  filters?: Record<string, any>;
}

/**
 * FuseSearchProvider - Main search service
 */
export class FuseSearchProvider<T = any> {
  private fuse: Fuse<T>;
  private dataType: keyof typeof SEARCH_CONFIGS;
  private rawData: T[];

  constructor(data: T[], dataType: keyof typeof SEARCH_CONFIGS = 'global') {
    this.dataType = dataType;
    this.rawData = data;
    this.fuse = new Fuse(data, SEARCH_CONFIGS[dataType] as Fuse.IFuseOptions<T>);
  }

  /**
   * Update the search index with new data
   * Call this when data changes to keep search results fresh
   */
  updateData(data: T[]): void {
    this.rawData = data;
    this.fuse = new Fuse(data, SEARCH_CONFIGS[this.dataType] as Fuse.IFuseOptions<T>);
  }

  /**
   * Perform fuzzy search with optional filters
   *
   * @param query - Search query (supports extended search syntax)
   * @param options - Search options for filtering and sorting
   * @returns Array of search results with scores and matches
   *
   * Extended search syntax:
   * - Exact match: ="john doe"
   * - Prefix match: ^John (starts with)
   * - Suffix match: .com$ (ends with)
   * - Inverse: !urgent (exclude)
   * - OR operator: john | jane
   * - AND operator: john & doe
   */
  search(query: string, options: SearchOptions = {}): SearchResult<T>[] {
    const startTime = performance.now();

    // Empty query returns all results
    if (!query || query.trim().length === 0) {
      return this.rawData.map((item) => ({
        item,
        score: 1,
        matches: [],
      }));
    }

    // Perform fuzzy search
    let results = this.fuse.search(query, {
      limit: options.limit,
    });

    // Apply custom threshold if provided
    if (options.threshold !== undefined) {
      results = results.filter((r) => (r.score ?? 1) <= options.threshold);
    }

    // Apply additional filters
    if (options.filters && Object.keys(options.filters).length > 0) {
      results = results.filter((result) => {
        return Object.entries(options.filters!).every(([key, value]) => {
          const itemValue = (result.item as any)[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      });
    }

    // Apply sorting
    if (options.sortBy) {
      results = this.sortResults(results, options.sortBy);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log performance (should be <50ms)
    if (duration > 50) {
      console.warn(`Search took ${duration.toFixed(2)}ms (target: <50ms)`);
    }

    return results.map((r) => ({
      item: r.item,
      score: r.score ?? 1,
      matches: r.matches,
      indices: r.matches?.[0]?.indices,
    }));
  }

  /**
   * Search with field-specific queries
   * Example: searchByField('name', 'John')
   */
  searchByField(field: string, value: string, options: SearchOptions = {}): SearchResult<T>[] {
    const query = `${field}:${value}`;
    return this.search(query, options);
  }

  /**
   * Multi-term search (all terms must match)
   */
  searchMulti(terms: string[], options: SearchOptions = {}): SearchResult<T>[] {
    const query = terms.map(t => `'${t}`).join(' '); // Fuse AND operator
    return this.search(query, options);
  }

  /**
   * Exact phrase search
   */
  searchExact(phrase: string, options: SearchOptions = {}): SearchResult<T>[] {
    const query = `="${phrase}"`;
    return this.search(query, options);
  }

  /**
   * Get suggestions for partial input (autocomplete)
   */
  getSuggestions(partial: string, limit: number = 5): string[] {
    if (partial.length < 2) return [];

    const results = this.search(partial, { limit });
    const suggestions = new Set<string>();

    results.forEach((result) => {
      if (result.matches) {
        result.matches.forEach((match) => {
          if (match.value) {
            suggestions.add(match.value);
          }
        });
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Sort search results by different criteria
   */
  private sortResults(
    results: Fuse.FuseResult<T>[],
    sortBy: 'relevance' | 'recent' | 'alphabetical'
  ): Fuse.FuseResult<T>[] {
    const sorted = [...results];

    switch (sortBy) {
      case 'relevance':
        // Already sorted by score (default)
        return sorted;

      case 'recent':
        return sorted.sort((a, b) => {
          const dateA = (a.item as any).created_at || (a.item as any).updated_at;
          const dateB = (b.item as any).created_at || (b.item as any).updated_at;
          if (!dateA || !dateB) return 0;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

      case 'alphabetical':
        return sorted.sort((a, b) => {
          const nameA = (a.item as any).name || (a.item as any).title || '';
          const nameB = (b.item as any).name || (b.item as any).title || '';
          return nameA.localeCompare(nameB);
        });

      default:
        return sorted;
    }
  }

  /**
   * Get search statistics (for analytics)
   */
  getStats() {
    return {
      totalItems: this.rawData.length,
      dataType: this.dataType,
      config: SEARCH_CONFIGS[this.dataType],
    };
  }
}

/**
 * Factory function to create search providers
 */
export function createSearchProvider<T>(
  data: T[],
  type: keyof typeof SEARCH_CONFIGS = 'global'
): FuseSearchProvider<T> {
  return new FuseSearchProvider<T>(data, type);
}

/**
 * Helper to highlight matched text
 * Returns array of segments with `highlight` flag
 */
export function getHighlightedSegments(
  text: string,
  matches?: Fuse.FuseResultMatch[]
): Array<{ text: string; highlight: boolean }> {
  if (!matches || matches.length === 0) {
    return [{ text, highlight: false }];
  }

  const segments: Array<{ text: string; highlight: boolean }> = [];
  let lastIndex = 0;

  // Collect all indices from all matches
  const allIndices: Array<[number, number]> = [];
  matches.forEach((match) => {
    if (match.indices) {
      allIndices.push(...match.indices);
    }
  });

  // Sort and merge overlapping indices
  const mergedIndices = allIndices
    .sort((a, b) => a[0] - b[0])
    .reduce((acc: Array<[number, number]>, curr) => {
      if (acc.length === 0) {
        acc.push(curr);
      } else {
        const last = acc[acc.length - 1];
        if (curr[0] <= last[1] + 1) {
          // Overlapping or adjacent - merge
          last[1] = Math.max(last[1], curr[1]);
        } else {
          acc.push(curr);
        }
      }
      return acc;
    }, []);

  // Build segments
  mergedIndices.forEach(([start, end]) => {
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), highlight: false });
    }
    segments.push({ text: text.slice(start, end + 1), highlight: true });
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false });
  }

  return segments;
}

export default FuseSearchProvider;

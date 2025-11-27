// Last Modified: 2025-11-24 16:53
/**
 * Search Suggestions & Typo Correction
 *
 * Philosophy: "Human-First Design" - Users shouldn't be penalized for typos.
 * The system should understand intent and suggest corrections intelligently.
 *
 * Features:
 * - Levenshtein distance for typo detection
 * - Popular search tracking
 * - Context-aware suggestions
 * - "Did you mean?" functionality
 * - Auto-complete based on data
 */

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for typo detection and correction suggestions
 *
 * @param a - First string
 * @param b - Second string
 * @returns Number of edits needed to transform a into b
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if a string is likely a typo of another
 * Returns true if edit distance <= 2
 */
export function isLikelyTypo(input: string, target: string, threshold: number = 2): boolean {
  if (Math.abs(input.length - target.length) > threshold) {
    return false; // Too different in length
  }
  return levenshteinDistance(input.toLowerCase(), target.toLowerCase()) <= threshold;
}

/**
 * Find similar terms from a dictionary
 * Returns array of suggestions sorted by similarity
 */
export function findSimilarTerms(
  input: string,
  dictionary: string[],
  maxSuggestions: number = 5,
  threshold: number = 2
): Array<{ term: string; distance: number }> {
  const suggestions = dictionary
    .map((term) => ({
      term,
      distance: levenshteinDistance(input.toLowerCase(), term.toLowerCase()),
    }))
    .filter((s) => s.distance <= threshold && s.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions);

  return suggestions;
}

/**
 * Popular search tracking
 * Stores in localStorage for persistence
 */
const POPULAR_SEARCHES_KEY = 'bollalabz_popular_searches';
const MAX_POPULAR_SEARCHES = 100;

export interface PopularSearch {
  query: string;
  count: number;
  lastSearched: string;
}

/**
 * Get popular searches from localStorage
 */
export function getPopularSearches(): PopularSearch[] {
  try {
    const stored = localStorage.getItem(POPULAR_SEARCHES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load popular searches:', error);
    return [];
  }
}

/**
 * Track a search query
 */
export function trackSearch(query: string): void {
  if (!query || query.trim().length < 2) return;

  const normalized = query.trim().toLowerCase();
  const searches = getPopularSearches();

  const existing = searches.find((s) => s.query === normalized);
  if (existing) {
    existing.count++;
    existing.lastSearched = new Date().toISOString();
  } else {
    searches.push({
      query: normalized,
      count: 1,
      lastSearched: new Date().toISOString(),
    });
  }

  // Sort by count and keep top N
  const sorted = searches
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_POPULAR_SEARCHES);

  try {
    localStorage.setItem(POPULAR_SEARCHES_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.error('Failed to save popular searches:', error);
  }
}

/**
 * Get top N popular searches
 */
export function getTopSearches(limit: number = 10): string[] {
  return getPopularSearches()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((s) => s.query);
}

/**
 * Recent searches tracking
 */
const RECENT_SEARCHES_KEY = 'bollalabz_recent_searches';
const MAX_RECENT_SEARCHES = 20;

/**
 * Get recent searches
 */
export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load recent searches:', error);
    return [];
  }
}

/**
 * Add to recent searches
 */
export function addRecentSearch(query: string): void {
  if (!query || query.trim().length < 2) return;

  const normalized = query.trim();
  const recent = getRecentSearches();

  // Remove duplicates
  const filtered = recent.filter((s) => s !== normalized);

  // Add to front
  filtered.unshift(normalized);

  // Keep only last N
  const updated = filtered.slice(0, MAX_RECENT_SEARCHES);

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent searches:', error);
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

/**
 * Context-aware suggestion builder
 * Combines multiple sources for intelligent suggestions
 */
export interface SuggestionSource {
  type: 'recent' | 'popular' | 'data' | 'correction';
  suggestions: string[];
}

export interface SmartSuggestions {
  recent: string[];
  popular: string[];
  corrections: Array<{ term: string; distance: number }>;
  dataMatches: string[];
}

/**
 * Build smart suggestions from multiple sources
 */
export function buildSmartSuggestions(
  input: string,
  dataTerms: string[],
  maxPerCategory: number = 5
): SmartSuggestions {
  const normalized = input.trim().toLowerCase();

  // Recent searches matching input
  const recent = getRecentSearches()
    .filter((s) => s.toLowerCase().includes(normalized))
    .slice(0, maxPerCategory);

  // Popular searches matching input
  const popular = getTopSearches(20)
    .filter((s) => s.includes(normalized))
    .slice(0, maxPerCategory);

  // Typo corrections from data terms
  const corrections = findSimilarTerms(normalized, dataTerms, maxPerCategory);

  // Prefix matches from data
  const dataMatches = dataTerms
    .filter((term) => term.toLowerCase().startsWith(normalized))
    .slice(0, maxPerCategory);

  return {
    recent,
    popular,
    corrections,
    dataMatches,
  };
}

/**
 * Generate "Did you mean?" suggestion
 * Returns best correction candidate or null
 */
export function getDidYouMean(
  query: string,
  knownTerms: string[],
  threshold: number = 2
): string | null {
  const normalized = query.trim().toLowerCase();

  // Don't suggest if query is very short
  if (normalized.length < 3) return null;

  // Find exact match
  const exactMatch = knownTerms.find((term) => term.toLowerCase() === normalized);
  if (exactMatch) return null; // No correction needed

  // Find closest match
  const similar = findSimilarTerms(normalized, knownTerms, 1, threshold);

  if (similar.length > 0) {
    return similar[0].term;
  }

  return null;
}

/**
 * Auto-complete based on partial input
 * Returns ranked suggestions
 */
export function getAutoComplete(
  partial: string,
  options: string[],
  maxResults: number = 10
): string[] {
  if (!partial || partial.length < 2) return [];

  const normalized = partial.toLowerCase();

  // Rank by:
  // 1. Starts with (highest priority)
  // 2. Contains word starting with
  // 3. Contains anywhere
  const startsWith = options.filter((opt) => opt.toLowerCase().startsWith(normalized));

  const wordStarts = options.filter((opt) => {
    const words = opt.toLowerCase().split(/\s+/);
    return words.some((word) => word.startsWith(normalized));
  });

  const contains = options.filter((opt) => opt.toLowerCase().includes(normalized));

  // Deduplicate and combine
  const combined = Array.from(
    new Set([...startsWith, ...wordStarts, ...contains])
  );

  return combined.slice(0, maxResults);
}

/**
 * Search query parser
 * Extracts special operators from query
 */
export interface ParsedQuery {
  raw: string;
  terms: string[];
  field?: string; // field:value queries
  exact?: string; // "exact phrase" queries
  exclude?: string[]; // !excluded terms
}

/**
 * Parse search query for special syntax
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const raw = query;
  let terms: string[] = [];
  let field: string | undefined;
  let exact: string | undefined;
  const exclude: string[] = [];

  // Extract field-specific query (field:value)
  const fieldMatch = query.match(/(\w+):([^\s]+)/);
  if (fieldMatch) {
    field = fieldMatch[1];
    terms.push(fieldMatch[2]);
  }

  // Extract exact phrases ("phrase")
  const exactMatch = query.match(/"([^"]+)"/);
  if (exactMatch) {
    exact = exactMatch[1];
  }

  // Extract excluded terms (!term)
  const excludeMatches = query.matchAll(/!(\w+)/g);
  for (const match of excludeMatches) {
    exclude.push(match[1]);
  }

  // Extract regular terms
  const cleanQuery = query
    .replace(/(\w+):([^\s]+)/g, '') // Remove field queries
    .replace(/"([^"]+)"/g, '') // Remove exact phrases
    .replace(/!(\w+)/g, ''); // Remove exclusions

  const regularTerms = cleanQuery
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  terms = [...new Set([...terms, ...regularTerms])];

  return {
    raw,
    terms,
    field,
    exact,
    exclude,
  };
}

/**
 * Build search dictionary from data
 * Extracts searchable terms from objects
 */
export function buildSearchDictionary<T extends Record<string, any>>(
  data: T[],
  fields: string[]
): string[] {
  const terms = new Set<string>();

  data.forEach((item) => {
    fields.forEach((field) => {
      const value = item[field];
      if (typeof value === 'string') {
        // Add whole value
        terms.add(value);
        // Add individual words
        value.split(/\s+/).forEach((word) => {
          if (word.length >= 2) {
            terms.add(word);
          }
        });
      } else if (Array.isArray(value)) {
        // Handle arrays (like tags)
        value.forEach((v) => {
          if (typeof v === 'string') {
            terms.add(v);
          }
        });
      }
    });
  });

  return Array.from(terms);
}

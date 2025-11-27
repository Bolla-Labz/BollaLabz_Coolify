// Last Modified: 2025-11-24 16:59
/**
 * Search Library Barrel Export
 */

export {
  FuseSearchProvider,
  createSearchProvider,
  getHighlightedSegments,
  type SearchResult,
  type SearchOptions,
} from './FuseSearchProvider';

export {
  levenshteinDistance,
  isLikelyTypo,
  findSimilarTerms,
  getPopularSearches,
  trackSearch,
  getTopSearches,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  buildSmartSuggestions,
  getDidYouMean,
  getAutoComplete,
  parseSearchQuery,
  buildSearchDictionary,
  type PopularSearch,
  type SmartSuggestions,
  type ParsedQuery,
} from './suggestions';

export {
  trackSearchEvent,
  calculateMetrics,
  getMetricsForPeriod,
  getMetricsForLastDays,
  exportAnalytics,
  getSearchQualityScore,
  getSearchInsights,
  getSessionId,
  resetSession,
  getAnalyticsEvents,
  cleanupOldAnalytics,
  type SearchEventType,
  type SearchAnalyticsEvent,
  type SearchMetrics,
} from './analytics';

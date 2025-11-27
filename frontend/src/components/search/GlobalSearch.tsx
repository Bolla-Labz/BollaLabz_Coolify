// Last Modified: 2025-11-24 16:57
/**
 * GlobalSearch Component - Command Palette Style
 *
 * Philosophy: "Zero Cognitive Load" + "Proactive Intelligence"
 * Search should be instant, intuitive, and always accessible.
 *
 * Features:
 * - Cmd+K / Ctrl+K to open
 * - Real-time fuzzy search across all data types
 * - Keyboard navigation (arrow keys + enter)
 * - Category grouping in results
 * - Recent searches
 * - Smart suggestions
 * - <50ms response time
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, Clock, TrendingUp, X, ArrowRight, User, MessageSquare, CheckSquare, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { HighlightedText } from './HighlightedText';
import { createSearchProvider, type SearchResult } from '@/lib/search/FuseSearchProvider';
import { getRecentSearches, addRecentSearch, buildSmartSuggestions, getDidYouMean, buildSearchDictionary } from '@/lib/search/suggestions';
import { trackSearchEvent } from '@/lib/search/analytics';
import { useContactsStore } from '@/stores/contactsStore';
import { useConversationsStore } from '@/stores/conversationsStore';
import { useTasksStore } from '@/stores/tasksStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { cn } from '@/lib/utils';

/**
 * Unified search result type
 */
interface UnifiedSearchResult {
  id: string;
  type: 'contact' | 'conversation' | 'task' | 'event';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  data: any;
  score: number;
  matches?: any[];
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get data from stores
  const { contacts } = useContactsStore();
  const { conversations } = useConversationsStore();
  const { tasks } = useTasksStore();
  const { events } = useCalendarStore();

  // Create search providers (memoized)
  const searchProviders = useMemo(() => {
    return {
      contacts: createSearchProvider(contacts, 'contacts'),
      conversations: createSearchProvider(conversations, 'conversations'),
      tasks: createSearchProvider(tasks, 'tasks'),
      events: createSearchProvider(events, 'events'),
    };
  }, [contacts, conversations, tasks, events]);

  // Build search dictionary for suggestions
  const searchDictionary = useMemo(() => {
    const contactTerms = buildSearchDictionary(contacts, ['name', 'email', 'company']);
    const taskTerms = buildSearchDictionary(tasks, ['title', 'description']);
    const eventTerms = buildSearchDictionary(events, ['title', 'description']);
    return [...contactTerms, ...taskTerms, ...eventTerms];
  }, [contacts, tasks, events]);

  // Recent searches
  const recentSearches = useMemo(() => getRecentSearches(), [open]);

  // Smart suggestions
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return null;
    return buildSmartSuggestions(query, searchDictionary, 3);
  }, [query, searchDictionary]);

  // Did you mean suggestion
  const didYouMean = useMemo(() => {
    if (!query || query.length < 3) return null;
    return getDidYouMean(query, searchDictionary);
  }, [query, searchDictionary]);

  /**
   * Perform search across all data types
   */
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      setSearchTime(0);
      return;
    }

    setIsSearching(true);
    const startTime = performance.now();

    try {
      // Search contacts
      const contactResults = searchProviders.contacts
        .search(searchQuery, { limit: 5 })
        .map((r: SearchResult) => ({
          id: r.item.id,
          type: 'contact' as const,
          title: r.item.name,
          subtitle: r.item.email || r.item.phone,
          icon: <User className="w-4 h-4" />,
          data: r.item,
          score: r.score,
          matches: r.matches,
        }));

      // Search conversations
      const conversationResults = searchProviders.conversations
        .search(searchQuery, { limit: 5 })
        .map((r: SearchResult) => ({
          id: r.item.id,
          type: 'conversation' as const,
          title: r.item.contact_name || 'Unknown',
          subtitle: r.item.last_message,
          icon: <MessageSquare className="w-4 h-4" />,
          data: r.item,
          score: r.score,
          matches: r.matches,
        }));

      // Search tasks
      const taskResults = searchProviders.tasks
        .search(searchQuery, { limit: 5 })
        .map((r: SearchResult) => ({
          id: r.item.id,
          type: 'task' as const,
          title: r.item.title,
          subtitle: r.item.description,
          icon: <CheckSquare className="w-4 h-4" />,
          data: r.item,
          score: r.score,
          matches: r.matches,
        }));

      // Search events
      const eventResults = searchProviders.events
        .search(searchQuery, { limit: 5 })
        .map((r: SearchResult) => ({
          id: r.item.id,
          type: 'event' as const,
          title: r.item.title,
          subtitle: r.item.description || r.item.location,
          icon: <Calendar className="w-4 h-4" />,
          data: r.item,
          score: r.score,
          matches: r.matches,
        }));

      // Combine and sort by relevance
      const allResults = [
        ...contactResults,
        ...conversationResults,
        ...taskResults,
        ...eventResults,
      ].sort((a, b) => a.score - b.score);

      setResults(allResults);
      setSelectedIndex(0);

      const endTime = performance.now();
      const duration = endTime - startTime;
      setSearchTime(duration);

      // Track analytics
      trackSearchEvent('search_performed', searchQuery, {
        category: 'global',
        resultCount: allResults.length,
        responseTime: duration,
      });

      if (allResults.length === 0) {
        trackSearchEvent('zero_results', searchQuery, {
          category: 'global',
        });
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchProviders]);

  /**
   * Handle query change with debouncing
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  /**
   * Handle result selection
   */
  const handleSelectResult = useCallback((result: UnifiedSearchResult, index: number) => {
    // Track click
    trackSearchEvent('result_clicked', query, {
      category: result.type,
      selectedResultIndex: index,
      selectedResultId: result.id,
    });

    // Add to recent searches
    addRecentSearch(query);

    // Navigate based on type
    const routes = {
      contact: `/contacts/${result.id}`,
      conversation: `/conversations/${result.id}`,
      task: `/tasks/${result.id}`,
      event: `/calendar?event=${result.id}`,
    };

    window.location.href = routes[result.type];
    onOpenChange(false);
  }, [query, onOpenChange]);

  /**
   * Keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex], selectedIndex);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, handleSelectResult, onOpenChange]);

  /**
   * Scroll selected result into view
   */
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, results]);

  /**
   * Focus input when opened
   */
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  /**
   * Group results by type
   */
  const groupedResults = useMemo(() => {
    const groups: Record<string, UnifiedSearchResult[]> = {
      contact: [],
      conversation: [],
      task: [],
      event: [],
    };

    results.forEach((result) => {
      groups[result.type].push(result);
    });

    return groups;
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, conversations, tasks, events..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Performance indicator */}
        {searchTime > 0 && (
          <div className="px-4 py-1 text-xs text-muted-foreground border-b">
            {results.length} results in {searchTime.toFixed(0)}ms
            {searchTime > 50 && (
              <Badge variant="outline" className="ml-2 text-yellow-600">
                Slow
              </Badge>
            )}
          </div>
        )}

        {/* Did you mean suggestion */}
        {didYouMean && (
          <div className="px-4 py-2 bg-muted/50 text-sm border-b">
            Did you mean:{' '}
            <button
              onClick={() => setQuery(didYouMean)}
              className="text-primary hover:underline font-medium"
            >
              {didYouMean}
            </button>
            ?
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          <div ref={resultsRef} className="p-2">
            {/* No query - show recent searches */}
            {!query && recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Recent Searches
                </div>
                <div className="space-y-0.5">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search results grouped by type */}
            {query && results.length > 0 && (
              <>
                {Object.entries(groupedResults).map(([type, typeResults]) => {
                  if (typeResults.length === 0) return null;

                  const categoryLabels = {
                    contact: 'Contacts',
                    conversation: 'Conversations',
                    task: 'Tasks',
                    event: 'Events',
                  };

                  return (
                    <div key={type} className="mb-4">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {categoryLabels[type as keyof typeof categoryLabels]}
                      </div>
                      <div className="space-y-0.5">
                        {typeResults.map((result, typeIndex) => {
                          const globalIndex = results.indexOf(result);
                          const isSelected = globalIndex === selectedIndex;

                          return (
                            <button
                              key={result.id}
                              data-index={globalIndex}
                              onClick={() => handleSelectResult(result, globalIndex)}
                              className={cn(
                                'w-full text-left px-3 py-2.5 rounded-md transition-colors',
                                'flex items-start gap-3',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              )}
                            >
                              <div
                                className={cn(
                                  'mt-0.5 flex-shrink-0',
                                  isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                                )}
                              >
                                {result.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  <HighlightedText
                                    text={result.title}
                                    matches={result.matches}
                                    highlightClassName={
                                      isSelected ? 'bg-primary-foreground/20' : ''
                                    }
                                  />
                                </div>
                                {result.subtitle && (
                                  <div
                                    className={cn(
                                      'text-sm truncate mt-0.5',
                                      isSelected
                                        ? 'text-primary-foreground/70'
                                        : 'text-muted-foreground'
                                    )}
                                  >
                                    <HighlightedText
                                      text={result.subtitle}
                                      matches={result.matches}
                                      maxLength={60}
                                      highlightClassName={
                                        isSelected ? 'bg-primary-foreground/20' : ''
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* No results */}
            {query && results.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <div className="text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
                {suggestions && suggestions.popular.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground mb-2">Try searching for:</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.popular.slice(0, 3).map((term, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(term)}
                          className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Keyboard shortcuts help */}
            {!query && recentSearches.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <div className="mb-2">Start typing to search...</div>
                <div className="text-xs space-y-1">
                  <div>↑↓ to navigate</div>
                  <div>↵ to select</div>
                  <div>ESC to close</div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to trigger global search with Cmd+K / Ctrl+K
 */
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}

export default GlobalSearch;

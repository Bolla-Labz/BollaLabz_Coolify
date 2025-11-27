// Last Modified: 2025-11-23 17:30
/**
 * Analytics Store
 *
 * Manages people analytics data including:
 * - Summary statistics
 * - Interaction trends
 * - Relationship health metrics
 * - Communication patterns
 */

import { create } from 'zustand';
import { analyticsService, type AnalyticsFilters } from '@/services/analyticsService';
import type {
  PeopleAnalyticsSummary,
  InteractionTrend,
  RelationshipHealthMetric,
  TopContact,
  InteractionSummary,
  CommunicationPattern,
} from '@/types/people-analytics';

interface AnalyticsState {
  // Core Data
  summary: PeopleAnalyticsSummary | null;
  interactionTrends: InteractionTrend[];
  relationshipHealth: RelationshipHealthMetric[];
  topContacts: TopContact[];
  interactionSummary: InteractionSummary | null;
  communicationPatterns: CommunicationPattern[];

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  dateRange: { startDate: string; endDate: string } | null;

  // Actions - Data Fetching
  fetchSummary: (filters?: AnalyticsFilters) => Promise<void>;
  fetchInteractionTrends: (startDate: string, endDate: string, groupBy?: 'day' | 'week' | 'month') => Promise<void>;
  fetchRelationshipHealth: (limit?: number) => Promise<void>;
  fetchTopContacts: (limit?: number, filters?: AnalyticsFilters) => Promise<void>;
  fetchInteractionSummary: (filters?: AnalyticsFilters) => Promise<void>;
  fetchCommunicationPatterns: (personId?: string) => Promise<void>;
  fetchDashboardData: (dateRange?: { startDate: string; endDate: string }) => Promise<void>;

  // Actions - Date Range
  setDateRange: (dateRange: { startDate: string; endDate: string } | null) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;
}

// Default state
const defaultState = {
  summary: null,
  interactionTrends: [],
  relationshipHealth: [],
  topContacts: [],
  interactionSummary: null,
  communicationPatterns: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  dateRange: null,
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchSummary: async (filters?: AnalyticsFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const summary = await analyticsService.getPeopleAnalyticsSummary(filters);
      set({ summary, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics summary';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchInteractionTrends: async (
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const trends = await analyticsService.getInteractionTrends(startDate, endDate, groupBy);
      set({ interactionTrends: trends, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interaction trends';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchRelationshipHealth: async (limit?: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const health = await analyticsService.getRelationshipHealthMetrics(limit);
      set({ relationshipHealth: health, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch relationship health';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTopContacts: async (limit: number = 10, filters?: AnalyticsFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const contacts = await analyticsService.getTopContacts(limit, filters);
      set({ topContacts: contacts, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top contacts';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchInteractionSummary: async (filters?: AnalyticsFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const summary = await analyticsService.getInteractionSummary(filters);
      set({ interactionSummary: summary, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interaction summary';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchCommunicationPatterns: async (personId?: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const patterns = await analyticsService.getCommunicationPatterns(personId);
      set({ communicationPatterns: patterns, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch communication patterns';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchDashboardData: async (dateRange?: { startDate: string; endDate: string }): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const dashboardData = await analyticsService.getDashboardData(dateRange);
      set({
        summary: dashboardData.summary,
        topContacts: dashboardData.topContacts,
        interactionTrends: dashboardData.trends,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // ============================================================================
  // Date Range Actions
  // ============================================================================

  setDateRange: (dateRange: { startDate: string; endDate: string } | null): void => {
    set({ dateRange });
  },

  // ============================================================================
  // Utility Actions
  // ============================================================================

  clearError: (): void => {
    set({ error: null });
  },

  reset: (): void => {
    set(defaultState);
  },
}));

export default useAnalyticsStore;

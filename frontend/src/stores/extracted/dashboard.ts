// Last Modified: 2025-11-23 17:30
/**
 * Dashboard Store
 *
 * Manages analytics, metrics, and dashboard state including:
 * - Summary statistics and trends
 * - Call volume data
 * - Cost analytics
 * - Agent performance metrics
 * - Activity tracking
 * - Time range filters
 */

import { create } from 'zustand';
import { dashboardAPI } from '@/lib/api/store-adapter';
import {
  AnalyticsSummary,
  DateRange,
  TimePeriod,
  QuickStat,
  CallVolumeData,
  AgentPerformance,
  ConversationMetrics,
  CostSummary,
  ActivityEvent,
  AnalyticsFilters,
} from '@/types/analytics';

interface DashboardState {
  // Core Data
  summary: AnalyticsSummary | null;
  quickStats: QuickStat[];
  callVolumeData: CallVolumeData[];
  agentPerformance: AgentPerformance[];
  conversationMetrics: ConversationMetrics | null;
  costSummary: CostSummary | null;
  recentActivity: ActivityEvent[];

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  selectedPeriod: TimePeriod;
  customDateRange: DateRange | null;
  selectedAgentIds: string[];
  refreshInterval: number | null; // Auto-refresh interval in ms

  // Actions - Data Fetching
  fetchDashboardData: () => Promise<void>;
  fetchSummary: (filters?: AnalyticsFilters) => Promise<void>;
  fetchQuickStats: (period: TimePeriod) => Promise<void>;
  fetchCallVolume: (filters?: AnalyticsFilters) => Promise<void>;
  fetchAgentPerformance: (filters?: AnalyticsFilters) => Promise<void>;
  fetchConversationMetrics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchCostSummary: (filters?: AnalyticsFilters) => Promise<void>;
  fetchRecentActivity: (limit?: number) => Promise<void>;

  // Actions - Filters
  setTimePeriod: (period: TimePeriod) => void;
  setCustomDateRange: (range: DateRange) => void;
  setSelectedAgents: (agentIds: string[]) => void;
  resetFilters: () => void;

  // Actions - Real-time
  startAutoRefresh: (intervalMs: number) => void;
  stopAutoRefresh: () => void;
  refreshData: () => Promise<void>;

  // Actions - Activity
  addActivityEvent: (event: ActivityEvent) => void;
  clearActivityEvents: () => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getActiveFilters: () => AnalyticsFilters;
  getTopPerformingAgents: (limit?: number) => AgentPerformance[];
}

// Default state
const defaultState = {
  summary: null,
  quickStats: [],
  callVolumeData: [],
  agentPerformance: [],
  conversationMetrics: null,
  costSummary: null,
  recentActivity: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  selectedPeriod: 'last_7_days' as TimePeriod,
  customDateRange: null,
  selectedAgentIds: [],
  refreshInterval: null,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchDashboardData: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const filters = get().getActiveFilters();

      // Fetch all dashboard data in parallel
      await Promise.all([
        get().fetchSummary(filters),
        get().fetchQuickStats(get().selectedPeriod),
        get().fetchCallVolume(filters),
        get().fetchAgentPerformance(filters),
        get().fetchConversationMetrics(filters),
        get().fetchCostSummary(filters),
        get().fetchRecentActivity(10),
      ]);

      set({
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  fetchSummary: async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getSummary(filters);
      // set({ summary: response.data });

      // Mock implementation for now
      set({ summary: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch summary';
      set({ error: errorMessage });
    }
  },

  fetchQuickStats: async (period: TimePeriod): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getQuickStats(period);
      // set({ quickStats: response.data });

      // Mock implementation for now
      set({ quickStats: [] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quick stats';
      set({ error: errorMessage });
    }
  },

  fetchCallVolume: async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getCallVolume(filters);
      // set({ callVolumeData: response.data });

      // Mock implementation for now
      set({ callVolumeData: [] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch call volume';
      set({ error: errorMessage });
    }
  },

  fetchAgentPerformance: async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getAgentPerformance(filters);
      // set({ agentPerformance: response.data });

      // Mock implementation for now
      set({ agentPerformance: [] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch agent performance';
      set({ error: errorMessage });
    }
  },

  fetchConversationMetrics: async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getConversationMetrics(filters);
      // set({ conversationMetrics: response.data });

      // Mock implementation for now
      set({ conversationMetrics: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conversation metrics';
      set({ error: errorMessage });
    }
  },

  fetchCostSummary: async (filters?: AnalyticsFilters): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getCostSummary(filters);
      // set({ costSummary: response.data });

      // Mock implementation for now
      set({ costSummary: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cost summary';
      set({ error: errorMessage });
    }
  },

  fetchRecentActivity: async (limit = 10): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getRecentActivity(limit);
      // set({ recentActivity: response.data });

      // Mock implementation for now
      set({ recentActivity: [] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recent activity';
      set({ error: errorMessage });
    }
  },

  // ============================================================================
  // Filter Actions
  // ============================================================================

  setTimePeriod: (period: TimePeriod): void => {
    set({
      selectedPeriod: period,
      customDateRange: period === 'custom' ? get().customDateRange : null,
    });
    // Auto-refresh data when period changes
    get().fetchDashboardData();
  },

  setCustomDateRange: (range: DateRange): void => {
    set({
      customDateRange: range,
      selectedPeriod: 'custom',
    });
    // Auto-refresh data when custom range is set
    get().fetchDashboardData();
  },

  setSelectedAgents: (agentIds: string[]): void => {
    set({ selectedAgentIds: agentIds });
    // Auto-refresh data when agents change
    get().fetchDashboardData();
  },

  resetFilters: (): void => {
    set({
      selectedPeriod: 'last_7_days',
      customDateRange: null,
      selectedAgentIds: [],
    });
    // Auto-refresh data after reset
    get().fetchDashboardData();
  },

  // ============================================================================
  // Real-time Actions
  // ============================================================================

  startAutoRefresh: (intervalMs: number): void => {
    // Clear existing interval if any
    const currentInterval = get().refreshInterval;
    if (currentInterval) {
      clearInterval(currentInterval);
    }

    // Set up new interval
    const interval = window.setInterval(() => {
      get().refreshData();
    }, intervalMs);

    set({ refreshInterval: interval });
  },

  stopAutoRefresh: (): void => {
    const interval = get().refreshInterval;
    if (interval) {
      clearInterval(interval);
      set({ refreshInterval: null });
    }
  },

  refreshData: async (): Promise<void> => {
    // Refresh without showing loading state
    const filters = get().getActiveFilters();

    try {
      await Promise.all([
        get().fetchSummary(filters),
        get().fetchQuickStats(get().selectedPeriod),
        get().fetchRecentActivity(10),
      ]);

      set({ lastUpdated: new Date() });
    } catch (error: unknown) {
      console.error('Auto-refresh failed:', error);
      // Don't set error state for background refreshes
    }
  },

  // ============================================================================
  // Activity Actions
  // ============================================================================

  addActivityEvent: (event: ActivityEvent): void => {
    set((state) => ({
      recentActivity: [event, ...state.recentActivity].slice(0, 20), // Keep last 20
    }));
  },

  clearActivityEvents: (): void => {
    set({ recentActivity: [] });
  },

  // ============================================================================
  // Utility Actions
  // ============================================================================

  clearError: (): void => {
    set({ error: null });
  },

  reset: (): void => {
    // Stop auto-refresh if active
    get().stopAutoRefresh();

    // Reset to default state
    set(defaultState);
  },

  // ============================================================================
  // Selectors (Derived State)
  // ============================================================================

  getActiveFilters: (): AnalyticsFilters => {
    const state = get();

    // Build date range based on selected period
    let dateRange: DateRange;

    if (state.selectedPeriod === 'custom' && state.customDateRange) {
      dateRange = state.customDateRange;
    } else {
      // Calculate date range based on period
      const end = new Date();
      const start = new Date();

      switch (state.selectedPeriod) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end.setDate(end.getDate() - 1);
          end.setHours(23, 59, 59, 999);
          break;
        case 'last_7_days':
          start.setDate(start.getDate() - 7);
          break;
        case 'last_30_days':
          start.setDate(start.getDate() - 30);
          break;
        case 'this_month':
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'last_month':
          start.setMonth(start.getMonth() - 1);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'this_year':
          start.setMonth(0);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start.setDate(start.getDate() - 7);
      }

      dateRange = { start, end };
    }

    return {
      dateRange,
      agentIds: state.selectedAgentIds.length > 0 ? state.selectedAgentIds : undefined,
    };
  },

  getTopPerformingAgents: (limit = 5): AgentPerformance[] => {
    const { agentPerformance } = get();

    return [...agentPerformance]
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  },
}));

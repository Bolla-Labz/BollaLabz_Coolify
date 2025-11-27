// Last Modified: 2025-11-23 17:30
/**
 * Finance Store
 *
 * Manages financial data and cost tracking including:
 * - Cost entries and transactions
 * - Budget management
 * - Resource cost tracking
 * - Budget alerts and thresholds
 * - Spending trends and forecasts
 */

import { create } from 'zustand';
import {
  CostEntry,
  CostSummary,
  CostBreakdown,
  SpendingTrendDataPoint,
  BudgetAlert,
  BudgetThreshold,
  ResourceCostStats,
  MonthlyBudget,
  ResourceType,
  BudgetStatus,
} from '@/types/finance';
import { financeAPI } from '@/lib/api/store-adapter';

interface FinanceFilters {
  resourceTypes?: ResourceType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minAmount?: number;
  maxAmount?: number;
  contactName?: string;
  agentName?: string;
  search?: string;
}

interface FinanceState {
  // Core Data
  costEntries: CostEntry[];
  costSummary: CostSummary | null;
  spendingTrends: SpendingTrendDataPoint[];
  budgetAlerts: BudgetAlert[];
  budgetThresholds: BudgetThreshold[];
  resourceStats: ResourceCostStats[];
  monthlyBudgets: MonthlyBudget[];

  // Selected Items
  selectedEntry: CostEntry | null;
  selectedMonth: { year: number; month: number } | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  filters: FinanceFilters;
  groupBy: 'day' | 'week' | 'month';

  // Actions - Data Fetching
  fetchCostEntries: (filters?: FinanceFilters) => Promise<void>;
  fetchCostSummary: (period?: { start: Date; end: Date }) => Promise<void>;
  fetchSpendingTrends: (period?: { start: Date; end: Date }) => Promise<void>;
  fetchBudgetAlerts: () => Promise<void>;
  fetchBudgetThresholds: () => Promise<void>;
  fetchResourceStats: (period?: { start: Date; end: Date }) => Promise<void>;
  fetchMonthlyBudgets: (year: number) => Promise<void>;

  // Actions - Cost Entries
  createCostEntry: (entry: Omit<CostEntry, 'id'>) => Promise<CostEntry | null>;
  updateCostEntry: (id: string, updates: Partial<CostEntry>) => Promise<CostEntry | null>;
  deleteCostEntry: (id: string) => Promise<boolean>;

  // Actions - Budgets
  setMonthlyBudget: (year: number, month: number, amount: number) => Promise<boolean>;
  updateMonthlyBudget: (year: number, month: number, amount: number) => Promise<boolean>;

  // Actions - Budget Thresholds
  createBudgetThreshold: (threshold: Omit<BudgetThreshold, 'id'>) => Promise<BudgetThreshold | null>;
  updateBudgetThreshold: (id: string, updates: Partial<BudgetThreshold>) => Promise<BudgetThreshold | null>;
  deleteBudgetThreshold: (id: string) => Promise<boolean>;
  toggleThreshold: (id: string) => Promise<boolean>;

  // Actions - Budget Alerts
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;

  // Actions - Filters
  setFilters: (filters: FinanceFilters) => void;
  setGroupBy: (groupBy: 'day' | 'week' | 'month') => void;
  resetFilters: () => void;

  // Actions - Selection
  selectEntry: (entry: CostEntry | null) => void;
  selectMonth: (year: number, month: number) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getFilteredEntries: () => CostEntry[];
  getTotalCost: (resourceType?: ResourceType) => number;
  getCostByResource: () => CostBreakdown[];
  getCurrentMonthBudget: () => MonthlyBudget | null;
  getActiveAlerts: () => BudgetAlert[];
  getCostForecast: (days: number) => number;
}

// Default state
const defaultState = {
  costEntries: [],
  costSummary: null,
  spendingTrends: [],
  budgetAlerts: [],
  budgetThresholds: [],
  resourceStats: [],
  monthlyBudgets: [],
  selectedEntry: null,
  selectedMonth: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {},
  groupBy: 'day' as const,
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchCostEntries: async (filters?: FinanceFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const response = await financeAPI.getCostEntries(filters);
      set({ costEntries: response.data, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cost entries';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchCostSummary: async (period?: { start: Date; end: Date }): Promise<void> => {
    try {
      const response = await financeAPI.getCostSummary(period);
      set({ costSummary: response.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cost summary';
      set({ error: errorMessage });
    }
  },

  fetchSpendingTrends: async (period?: { start: Date; end: Date }): Promise<void> => {
    try {
      const response = await financeAPI.getSpendingTrends(period);
      set({ spendingTrends: response.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch spending trends';
      set({ error: errorMessage });
    }
  },

  fetchBudgetAlerts: async (): Promise<void> => {
    try {
      const response = await financeAPI.getBudgetAlerts();
      set({ budgetAlerts: response.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch budget alerts';
      set({ error: errorMessage });
    }
  },

  fetchBudgetThresholds: async (): Promise<void> => {
    try {
      const response = await financeAPI.getBudgetThresholds();
      set({ budgetThresholds: response.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch budget thresholds';
      set({ error: errorMessage });
    }
  },

  fetchResourceStats: async (period?: { start: Date; end: Date }): Promise<void> => {
    try {
      const response = await financeAPI.getResourceStats(period);
      set({ resourceStats: response.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resource stats';
      set({ error: errorMessage });
    }
  },

  fetchMonthlyBudgets: async (year: number): Promise<void> => {
    try {
      const response = await financeAPI.getMonthlyBudgets(year);
      set({ monthlyBudgets: response.data });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch monthly budgets';
      set({ error: errorMessage });
    }
  },

  // ============================================================================
  // Cost Entry Actions
  // ============================================================================

  createCostEntry: async (entry: Omit<CostEntry, 'id'>): Promise<CostEntry | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await financeAPI.createCostEntry(entry);
      const newEntry = response.data;

      set((state) => ({
        costEntries: [...state.costEntries, newEntry],
        isLoading: false,
        lastUpdated: new Date(),
      }));

      return newEntry;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create cost entry';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateCostEntry: async (id: string, updates: Partial<CostEntry>): Promise<CostEntry | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await financeAPI.updateCostEntry(id, updates);
      const updatedEntry = response.data;

      set((state) => ({
        costEntries: state.costEntries.map((e) => (e.id === id ? updatedEntry : e)),
        selectedEntry: state.selectedEntry?.id === id ? updatedEntry : state.selectedEntry,
        isLoading: false,
      }));

      return updatedEntry;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update cost entry';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteCostEntry: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await financeAPI.deleteCostEntry(id);

      set((state) => ({
        costEntries: state.costEntries.filter((e) => e.id !== id),
        selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete cost entry';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Budget Actions
  // ============================================================================

  setMonthlyBudget: async (year: number, month: number, amount: number): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await financeAPI.setMonthlyBudget(year, month, amount);
      await get().fetchMonthlyBudgets(year);
      set({ isLoading: false });
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set monthly budget';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  updateMonthlyBudget: async (year: number, month: number, amount: number): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await financeApi.updateMonthlyBudget(year, month, amount);

      set((state) => ({
        monthlyBudgets: state.monthlyBudgets.map((b) =>
          b.year === year && b.month === month
            ? {
                ...b,
                budgetAmount: amount,
                remaining: amount - b.spent,
                percentageUsed: (b.spent / amount) * 100,
              }
            : b
        ),
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update monthly budget';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Budget Threshold Actions
  // ============================================================================

  createBudgetThreshold: async (threshold: Omit<BudgetThreshold, 'id'>): Promise<BudgetThreshold | null> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await financeApi.createBudgetThreshold(threshold);
      // const newThreshold = response.data;

      // Mock implementation
      const newThreshold: BudgetThreshold = {
        ...threshold,
        id: Math.random().toString(36).substr(2, 9),
      };

      set((state) => ({
        budgetThresholds: [...state.budgetThresholds, newThreshold],
        isLoading: false,
      }));

      return newThreshold;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create budget threshold';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateBudgetThreshold: async (id: string, updates: Partial<BudgetThreshold>): Promise<BudgetThreshold | null> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await financeApi.updateBudgetThreshold(id, updates);
      // const updatedThreshold = response.data;

      // Mock implementation
      const threshold = get().budgetThresholds.find((t) => t.id === id);
      if (!threshold) throw new Error('Threshold not found');

      const updatedThreshold = { ...threshold, ...updates };

      set((state) => ({
        budgetThresholds: state.budgetThresholds.map((t) => (t.id === id ? updatedThreshold : t)),
        isLoading: false,
      }));

      return updatedThreshold;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update budget threshold';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteBudgetThreshold: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await financeApi.deleteBudgetThreshold(id);

      set((state) => ({
        budgetThresholds: state.budgetThresholds.filter((t) => t.id !== id),
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete budget threshold';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  toggleThreshold: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await financeApi.toggleBudgetThreshold(id);

      set((state) => ({
        budgetThresholds: state.budgetThresholds.map((t) =>
          t.id === id ? { ...t, enabled: !t.enabled } : t
        ),
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle budget threshold';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Budget Alert Actions
  // ============================================================================

  dismissAlert: (id: string): void => {
    set((state) => ({
      budgetAlerts: state.budgetAlerts.filter((alert) => alert.id !== id),
    }));
  },

  clearAlerts: (): void => {
    set({ budgetAlerts: [] });
  },

  // ============================================================================
  // Filter Actions
  // ============================================================================

  setFilters: (filters: FinanceFilters): void => {
    set({ filters });
    // Auto-refresh data when filters change
    get().fetchCostEntries(filters);
  },

  setGroupBy: (groupBy: 'day' | 'week' | 'month'): void => {
    set({ groupBy });
  },

  resetFilters: (): void => {
    set({ filters: {} });
    get().fetchCostEntries();
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectEntry: (entry: CostEntry | null): void => {
    set({ selectedEntry: entry });
  },

  selectMonth: (year: number, month: number): void => {
    set({ selectedMonth: { year, month } });
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

  // ============================================================================
  // Selectors (Derived State)
  // ============================================================================

  getFilteredEntries: (): CostEntry[] => {
    const { costEntries, filters } = get();

    return costEntries.filter((entry) => {
      // Resource type filter
      if (filters.resourceTypes?.length && !filters.resourceTypes.includes(entry.resourceType)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const entryDate = new Date(entry.date);
        if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
          return false;
        }
      }

      // Amount range filter
      if (filters.minAmount !== undefined && entry.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && entry.amount > filters.maxAmount) {
        return false;
      }

      // Contact name filter
      if (filters.contactName && entry.contactName !== filters.contactName) {
        return false;
      }

      // Agent name filter
      if (filters.agentName && entry.agentName !== filters.agentName) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesDescription = entry.description.toLowerCase().includes(searchLower);
        const matchesContact = entry.contactName?.toLowerCase().includes(searchLower);
        const matchesAgent = entry.agentName?.toLowerCase().includes(searchLower);

        if (!matchesDescription && !matchesContact && !matchesAgent) {
          return false;
        }
      }

      return true;
    });
  },

  getTotalCost: (resourceType?: ResourceType): number => {
    const entries = get().getFilteredEntries();

    return entries
      .filter((entry) => !resourceType || entry.resourceType === resourceType)
      .reduce((total, entry) => total + entry.amount, 0);
  },

  getCostByResource: (): CostBreakdown[] => {
    const entries = get().getFilteredEntries();
    const total = get().getTotalCost();

    const resourceMap = new Map<ResourceType, { amount: number; count: number }>();

    entries.forEach((entry) => {
      const current = resourceMap.get(entry.resourceType) || { amount: 0, count: 0 };
      resourceMap.set(entry.resourceType, {
        amount: current.amount + entry.amount,
        count: current.count + 1,
      });
    });

    return Array.from(resourceMap.entries()).map(([resourceType, data]) => ({
      resourceType,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      count: data.count,
    }));
  },

  getCurrentMonthBudget: (): MonthlyBudget | null => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return (
      get().monthlyBudgets.find((b) => b.year === year && b.month === month) || null
    );
  },

  getActiveAlerts: (): BudgetAlert[] => {
    return get().budgetAlerts.filter((alert) => !alert.dismissible);
  },

  getCostForecast: (days: number): number => {
    const entries = get().getFilteredEntries();

    // Calculate average daily cost from recent entries
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const recentEntries = entries.filter((entry) => new Date(entry.date) >= startDate);
    const totalCost = recentEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const avgDailyCost = totalCost / 30;

    return avgDailyCost * days;
  },
}));

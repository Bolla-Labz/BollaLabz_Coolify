// Last Modified: 2025-11-23 17:30
// Financial Data Store using Zustand

import { create } from 'zustand';
import type {
  BankAccount,
  Transaction,
  CreditScore,
  CreditCard,
  FinancialGoal,
  FinancialSummary,
  ExpenseByCategory,
} from '../types/financial';

interface FinancialState {
  // Bank Accounts
  accounts: BankAccount[];
  selectedAccount: BankAccount | null;
  isLoadingAccounts: boolean;

  // Transactions
  transactions: Transaction[];
  isLoadingTransactions: boolean;

  // Credit
  creditScores: CreditScore[];
  creditCards: CreditCard[];
  isLoadingCredit: boolean;

  // Goals
  goals: FinancialGoal[];
  isLoadingGoals: boolean;

  // Summary
  summary: FinancialSummary | null;

  // Actions
  setAccounts: (accounts: BankAccount[]) => void;
  addAccount: (account: BankAccount) => void;
  removeAccount: (accountId: string) => void;
  selectAccount: (account: BankAccount | null) => void;
  setLoadingAccounts: (loading: boolean) => void;

  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoadingTransactions: (loading: boolean) => void;

  setCreditScores: (scores: CreditScore[]) => void;
  addCreditScore: (score: CreditScore) => void;
  setCreditCards: (cards: CreditCard[]) => void;
  addCreditCard: (card: CreditCard) => void;
  updateCreditCard: (cardId: string, updates: Partial<CreditCard>) => void;
  setLoadingCredit: (loading: boolean) => void;

  setGoals: (goals: FinancialGoal[]) => void;
  addGoal: (goal: FinancialGoal) => void;
  updateGoal: (goalId: string, updates: Partial<FinancialGoal>) => void;
  removeGoal: (goalId: string) => void;
  setLoadingGoals: (loading: boolean) => void;

  setSummary: (summary: FinancialSummary) => void;

  // Computed values
  getTotalBalance: () => number;
  getExpensesByCategory: () => ExpenseByCategory[];
  getRecentTransactions: (limit?: number) => Transaction[];
  getLatestCreditScore: () => CreditScore | null;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  // Initial state
  accounts: [],
  selectedAccount: null,
  isLoadingAccounts: false,

  transactions: [],
  isLoadingTransactions: false,

  creditScores: [],
  creditCards: [],
  isLoadingCredit: false,

  goals: [],
  isLoadingGoals: false,

  summary: null,

  // Account actions
  setAccounts: (accounts) => set({ accounts }),

  addAccount: (account) =>
    set((state) => ({ accounts: [...state.accounts, account] })),

  removeAccount: (accountId) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== accountId),
      selectedAccount:
        state.selectedAccount?.id === accountId ? null : state.selectedAccount,
    })),

  selectAccount: (account) => set({ selectedAccount: account }),

  setLoadingAccounts: (loading) => set({ isLoadingAccounts: loading }),

  // Transaction actions
  setTransactions: (transactions) => set({ transactions }),

  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),

  setLoadingTransactions: (loading) => set({ isLoadingTransactions: loading }),

  // Credit actions
  setCreditScores: (scores) => set({ creditScores: scores }),

  addCreditScore: (score) =>
    set((state) => ({ creditScores: [...state.creditScores, score] })),

  setCreditCards: (cards) => set({ creditCards: cards }),

  addCreditCard: (card) =>
    set((state) => ({ creditCards: [...state.creditCards, card] })),

  updateCreditCard: (cardId, updates) =>
    set((state) => ({
      creditCards: state.creditCards.map((card) =>
        card.id === cardId ? { ...card, ...updates } : card
      ),
    })),

  setLoadingCredit: (loading) => set({ isLoadingCredit: loading }),

  // Goal actions
  setGoals: (goals) => set({ goals }),

  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),

  updateGoal: (goalId, updates) =>
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      ),
    })),

  removeGoal: (goalId) =>
    set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) })),

  setLoadingGoals: (loading) => set({ isLoadingGoals: loading }),

  // Summary action
  setSummary: (summary) => set({ summary }),

  // Computed values
  getTotalBalance: () => {
    const state = get();
    return state.accounts.reduce(
      (total, account) => total + account.currentBalance,
      0
    );
  },

  getExpensesByCategory: () => {
    const state = get();
    const categoryMap = new Map<string, number>();

    // Sum transactions by category
    state.transactions
      .filter((tx) => tx.transactionType === 'debit')
      .forEach((tx) => {
        const category = tx.category || 'Uncategorized';
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Math.abs(tx.amount));
      });

    // Calculate total for percentages
    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

    // Convert to array with percentages
    const colors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
    ];

    return Array.from(categoryMap.entries()).map(([category, amount], index) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: colors[index % colors.length],
    }));
  },

  getRecentTransactions: (limit = 10) => {
    const state = get();
    return state.transactions
      .sort(
        (a, b) =>
          b.transactionDate.getTime() - a.transactionDate.getTime()
      )
      .slice(0, limit);
  },

  getLatestCreditScore: () => {
    const state = get();
    if (state.creditScores.length === 0) return null;

    return state.creditScores.reduce((latest, score) =>
      score.scoreDate > latest.scoreDate ? score : latest
    );
  },
}));

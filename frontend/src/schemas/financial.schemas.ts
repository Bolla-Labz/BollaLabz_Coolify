// Last Modified: 2025-11-23 17:30
// Zod validation schemas for Financial data

import { z } from 'zod';

// Bank Account Schema
export const bankAccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  institutionName: z.string().min(1, 'Institution name is required'),
  accountType: z.enum(['checking', 'savings', 'credit', 'investment']),
  accountNumber: z.string().min(1), // encrypted
  currentBalance: z.number(),
  availableBalance: z.number().optional(),
  currency: z.string().length(3).default('USD'),
  plaidAccountId: z.string().optional(),
  plaidAccessToken: z.string().optional(), // encrypted
  isActive: z.boolean().default(true),
  lastSyncedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Transaction Schema
export const transactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  plaidTransactionId: z.string().optional(),
  transactionDate: z.date(),
  postedDate: z.date().optional(),
  amount: z.number(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  merchantName: z.string().optional(),
  description: z.string().optional(),
  transactionType: z.enum(['debit', 'credit']),
  pending: z.boolean().default(false),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  createdAt: z.date(),
});

// Transaction Category Schema
export const transactionCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
  icon: z.string().optional(),
  budgetLimit: z.number().positive().optional(),
  createdAt: z.date(),
});

// Credit Score Schema
export const creditScoreSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bureau: z.enum(['Equifax', 'Experian', 'TransUnion']),
  score: z.number().int().min(300).max(850),
  scoreDate: z.date(),
  creditUtilization: z.number().min(0).max(100).optional(),
  totalAccounts: z.number().int().nonnegative().optional(),
  openAccounts: z.number().int().nonnegative().optional(),
  totalBalance: z.number().optional(),
  availableCredit: z.number().optional(),
  paymentHistoryPercentage: z.number().min(0).max(100).optional(),
  averageAccountAgeMonths: z.number().int().nonnegative().optional(),
  hardInquiries: z.number().int().nonnegative().optional(),
  derogatoryMarks: z.number().int().nonnegative().optional(),
  createdAt: z.date(),
});

// Credit Card Schema
export const creditCardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  cardName: z.string().min(1, 'Card name is required'),
  issuer: z.string().optional(),
  cardType: z.enum(['visa', 'mastercard', 'amex', 'discover', 'other']),
  lastFourDigits: z.string().length(4).regex(/^\d{4}$/, 'Must be 4 digits'),
  creditLimit: z.number().positive(),
  currentBalance: z.number().nonnegative(),
  availableCredit: z.number().nonnegative(),
  apr: z.number().min(0).max(100),
  paymentDueDate: z.date().optional(),
  minimumPayment: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Financial Goal Schema
export const financialGoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  goalName: z.string().min(1, 'Goal name is required'),
  goalType: z.enum(['savings', 'debt_reduction', 'investment', 'other']),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  targetDate: z.date().optional(),
  isCompleted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Form Schemas (for creating/updating)
export const createBankAccountSchema = bankAccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createTransactionSchema = transactionSchema.omit({
  id: true,
  createdAt: true,
});

export const createCreditCardSchema = creditCardSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createFinancialGoalSchema = financialGoalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type BankAccountInput = z.infer<typeof createBankAccountSchema>;
export type TransactionInput = z.infer<typeof createTransactionSchema>;
export type CreditCardInput = z.infer<typeof createCreditCardSchema>;
export type FinancialGoalInput = z.infer<typeof createFinancialGoalSchema>;

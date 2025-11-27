// Last Modified: 2025-11-23 17:30
// Financial Data Types for BollaLabz

export interface BankAccount {
  id: string;
  userId: string;
  institutionName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  accountNumber: string; // encrypted
  currentBalance: number;
  availableBalance?: number;
  currency: string;
  plaidAccountId?: string;
  plaidAccessToken?: string; // encrypted
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  plaidTransactionId?: string;
  transactionDate: Date;
  postedDate?: Date;
  amount: number;
  category?: string;
  subcategory?: string;
  merchantName?: string;
  description?: string;
  transactionType: 'debit' | 'credit';
  pending: boolean;
  locationCity?: string;
  locationState?: string;
  createdAt: Date;
}

export interface TransactionCategory {
  id: string;
  name: string;
  color: string; // hex color
  icon?: string;
  budgetLimit?: number;
  createdAt: Date;
}

export interface CreditScore {
  id: string;
  userId: string;
  bureau: 'Equifax' | 'Experian' | 'TransUnion';
  score: number; // 300-850
  scoreDate: Date;
  creditUtilization?: number; // percentage
  totalAccounts?: number;
  openAccounts?: number;
  totalBalance?: number;
  availableCredit?: number;
  paymentHistoryPercentage?: number;
  averageAccountAgeMonths?: number;
  hardInquiries?: number;
  derogatoryMarks?: number;
  createdAt: Date;
}

export interface CreditCard {
  id: string;
  userId: string;
  cardName: string;
  issuer?: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  lastFourDigits: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  apr: number;
  paymentDueDate?: Date;
  minimumPayment?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  goalName: string;
  goalType: 'savings' | 'debt_reduction' | 'investment' | 'other';
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Plaid Integration Types
export interface PlaidLinkToken {
  linkToken: string;
  expiration: Date;
}

export interface PlaidPublicToken {
  publicToken: string;
  institutionId: string;
  institutionName: string;
}

export interface PlaidAccessToken {
  accessToken: string;
  itemId: string;
}

// Financial Dashboard Data
export interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
  categories: ExpenseByCategory[];
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  monthlyBudget: number;
  budgetRemaining: number;
  savingsRate: number;
}

// Credit Dashboard Data
export interface CreditUtilization {
  totalCredit: number;
  usedCredit: number;
  utilizationPercentage: number;
  recommendation: 'good' | 'fair' | 'poor';
}

export interface PaymentHistoryItem {
  date: Date;
  status: 'on-time' | 'late' | 'missed';
  amount: number;
  creditor: string;
}

export interface CreditRecommendation {
  type: 'increase_limit' | 'pay_balance' | 'reduce_usage' | 'dispute_error';
  title: string;
  description: string;
  potentialImpact: number; // points
  priority: 'high' | 'medium' | 'low';
}

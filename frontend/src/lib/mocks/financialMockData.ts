// Last Modified: 2025-11-23 17:30
// Mock Financial Data Generator

import type {
  BankAccount,
  Transaction,
  CreditScore,
  CreditCard,
  FinancialGoal,
  TransactionCategory,
} from '../../types/financial';

// Generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock Transaction Categories
export const mockTransactionCategories: TransactionCategory[] = [
  { id: '1', name: 'Food & Dining', color: '#FF6384', icon: 'utensils', budgetLimit: 800, createdAt: new Date() },
  { id: '2', name: 'Shopping', color: '#36A2EB', icon: 'shopping-bag', budgetLimit: 500, createdAt: new Date() },
  { id: '3', name: 'Transportation', color: '#FFCE56', icon: 'car', budgetLimit: 400, createdAt: new Date() },
  { id: '4', name: 'Entertainment', color: '#4BC0C0', icon: 'film', budgetLimit: 300, createdAt: new Date() },
  { id: '5', name: 'Utilities', color: '#9966FF', icon: 'zap', budgetLimit: 200, createdAt: new Date() },
  { id: '6', name: 'Healthcare', color: '#FF9F40', icon: 'heart', budgetLimit: 250, createdAt: new Date() },
  { id: '7', name: 'Income', color: '#10B981', icon: 'dollar-sign', createdAt: new Date() },
  { id: '8', name: 'Transfer', color: '#6B7280', icon: 'arrow-right', createdAt: new Date() },
];

// Mock Bank Accounts
export function generateMockBankAccounts(userId: string): BankAccount[] {
  return [
    {
      id: generateId(),
      userId,
      institutionName: 'Chase Bank',
      accountType: 'checking',
      accountNumber: '****1234',
      currentBalance: 15420.50,
      availableBalance: 15420.50,
      currency: 'USD',
      plaidAccountId: 'chase_checking_1234',
      isActive: true,
      lastSyncedAt: new Date(),
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      institutionName: 'Bank of America',
      accountType: 'savings',
      accountNumber: '****5678',
      currentBalance: 28750.25,
      availableBalance: 28750.25,
      currency: 'USD',
      plaidAccountId: 'boa_savings_5678',
      isActive: true,
      lastSyncedAt: new Date(),
      createdAt: new Date('2022-06-20'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      institutionName: 'Wells Fargo',
      accountType: 'checking',
      accountNumber: '****9012',
      currentBalance: 8934.75,
      availableBalance: 8934.75,
      currency: 'USD',
      plaidAccountId: 'wf_checking_9012',
      isActive: true,
      lastSyncedAt: new Date(),
      createdAt: new Date('2021-03-10'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      institutionName: 'Ally Bank',
      accountType: 'savings',
      accountNumber: '****3456',
      currentBalance: 45600.00,
      availableBalance: 45600.00,
      currency: 'USD',
      plaidAccountId: 'ally_savings_3456',
      isActive: true,
      lastSyncedAt: new Date(),
      createdAt: new Date('2020-09-05'),
      updatedAt: new Date(),
    },
  ];
}

// Mock Transactions
export function generateMockTransactions(accounts: BankAccount[]): Transaction[] {
  const transactions: Transaction[] = [];
  const merchants = [
    { name: 'Starbucks', category: 'Food & Dining', avgAmount: 15 },
    { name: 'Whole Foods', category: 'Food & Dining', avgAmount: 85 },
    { name: 'Amazon', category: 'Shopping', avgAmount: 120 },
    { name: 'Target', category: 'Shopping', avgAmount: 65 },
    { name: 'Uber', category: 'Transportation', avgAmount: 25 },
    { name: 'Shell Gas Station', category: 'Transportation', avgAmount: 50 },
    { name: 'Netflix', category: 'Entertainment', avgAmount: 15.99 },
    { name: 'Spotify', category: 'Entertainment', avgAmount: 9.99 },
    { name: 'PG&E', category: 'Utilities', avgAmount: 120 },
    { name: 'AT&T', category: 'Utilities', avgAmount: 85 },
    { name: 'CVS Pharmacy', category: 'Healthcare', avgAmount: 45 },
    { name: 'Kaiser Permanente', category: 'Healthcare', avgAmount: 200 },
    { name: 'Salary Deposit', category: 'Income', avgAmount: 5000 },
    { name: 'Freelance Payment', category: 'Income', avgAmount: 1500 },
  ];

  const cities = ['San Francisco', 'New York', 'Los Angeles', 'Seattle', 'Austin', 'Boston'];
  const states = ['CA', 'NY', 'CA', 'WA', 'TX', 'MA'];

  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Generate 150 transactions over the last 6 months
  for (let i = 0; i < 150; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const account = accounts[Math.floor(Math.random() * accounts.length)];
    const isIncome = merchant.category === 'Income';
    const amount = merchant.avgAmount * (0.8 + Math.random() * 0.4); // ±20% variation
    const locationIndex = Math.floor(Math.random() * cities.length);

    transactions.push({
      id: generateId(),
      accountId: account.id,
      plaidTransactionId: `plaid_tx_${generateId()}`,
      transactionDate: randomDate(sixMonthsAgo, now),
      postedDate: randomDate(sixMonthsAgo, now),
      amount: Math.round(amount * 100) / 100,
      category: merchant.category,
      subcategory: merchant.category,
      merchantName: merchant.name,
      description: merchant.name,
      transactionType: isIncome ? 'credit' : 'debit',
      pending: Math.random() < 0.05, // 5% pending
      locationCity: cities[locationIndex],
      locationState: states[locationIndex],
      createdAt: new Date(),
    });
  }

  // Sort by date (most recent first)
  return transactions.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
}

// Mock Credit Scores
export function generateMockCreditScores(userId: string): CreditScore[] {
  const scores: CreditScore[] = [];
  const now = new Date();

  // Generate credit scores for the last 12 months
  for (let i = 0; i < 12; i++) {
    const scoreDate = new Date(now);
    scoreDate.setMonth(scoreDate.getMonth() - i);

    const baseScore = 720 + Math.floor(Math.random() * 30); // 720-750 range

    scores.push({
      id: generateId(),
      userId,
      bureau: 'Experian',
      score: baseScore,
      scoreDate,
      creditUtilization: 25 + Math.random() * 20, // 25-45%
      totalAccounts: 12,
      openAccounts: 10,
      totalBalance: 45000 + Math.random() * 10000,
      availableCredit: 100000,
      paymentHistoryPercentage: 95 + Math.random() * 5, // 95-100%
      averageAccountAgeMonths: 48 + i,
      hardInquiries: Math.floor(Math.random() * 3),
      derogatoryMarks: 0,
      createdAt: scoreDate,
    });
  }

  return scores.sort((a, b) => b.scoreDate.getTime() - a.scoreDate.getTime());
}

// Mock Credit Cards
export function generateMockCreditCards(userId: string): CreditCard[] {
  return [
    {
      id: generateId(),
      userId,
      cardName: 'Chase Sapphire Preferred',
      issuer: 'Chase',
      cardType: 'visa',
      lastFourDigits: '1234',
      creditLimit: 25000,
      currentBalance: 8420.50,
      availableCredit: 16579.50,
      apr: 18.99,
      paymentDueDate: new Date(new Date().setDate(25)),
      minimumPayment: 250,
      isActive: true,
      createdAt: new Date('2021-03-15'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      cardName: 'American Express Gold',
      issuer: 'American Express',
      cardType: 'amex',
      lastFourDigits: '5678',
      creditLimit: 30000,
      currentBalance: 4230.75,
      availableCredit: 25769.25,
      apr: 19.99,
      paymentDueDate: new Date(new Date().setDate(15)),
      minimumPayment: 150,
      isActive: true,
      createdAt: new Date('2020-07-20'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      cardName: 'Citi Double Cash',
      issuer: 'Citibank',
      cardType: 'mastercard',
      lastFourDigits: '9012',
      creditLimit: 15000,
      currentBalance: 2840.00,
      availableCredit: 12160.00,
      apr: 16.99,
      paymentDueDate: new Date(new Date().setDate(5)),
      minimumPayment: 85,
      isActive: true,
      createdAt: new Date('2019-11-10'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      cardName: 'Discover it Cash Back',
      issuer: 'Discover',
      cardType: 'discover',
      lastFourDigits: '3456',
      creditLimit: 20000,
      currentBalance: 1560.25,
      availableCredit: 18439.75,
      apr: 17.49,
      paymentDueDate: new Date(new Date().setDate(20)),
      minimumPayment: 50,
      isActive: true,
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date(),
    },
  ];
}

// Mock Financial Goals
export function generateMockFinancialGoals(userId: string): FinancialGoal[] {
  return [
    {
      id: generateId(),
      userId,
      goalName: 'Emergency Fund',
      goalType: 'savings',
      targetAmount: 25000,
      currentAmount: 18500,
      targetDate: new Date('2026-12-31'),
      isCompleted: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      goalName: 'Pay Off Credit Card Debt',
      goalType: 'debt_reduction',
      targetAmount: 15000,
      currentAmount: 8420.50,
      targetDate: new Date('2025-12-31'),
      isCompleted: false,
      createdAt: new Date('2024-06-15'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      goalName: 'Down Payment for House',
      goalType: 'savings',
      targetAmount: 100000,
      currentAmount: 45600,
      targetDate: new Date('2027-06-30'),
      isCompleted: false,
      createdAt: new Date('2023-09-01'),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      userId,
      goalName: 'Vacation Fund',
      goalType: 'savings',
      targetAmount: 5000,
      currentAmount: 5000,
      targetDate: new Date('2025-07-01'),
      isCompleted: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
  ];
}

// Generate all mock financial data
export function generateAllMockFinancialData(userId: string = 'mock-user-123') {
  const accounts = generateMockBankAccounts(userId);
  const transactions = generateMockTransactions(accounts);
  const creditScores = generateMockCreditScores(userId);
  const creditCards = generateMockCreditCards(userId);
  const goals = generateMockFinancialGoals(userId);

  return {
    accounts,
    transactions,
    creditScores,
    creditCards,
    goals,
    categories: mockTransactionCategories,
  };
}

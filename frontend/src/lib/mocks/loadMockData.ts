// Last Modified: 2025-11-23 17:30
// Load Mock Data into Stores
// Call this function to populate the app with test data

import { useFinancialStore } from '../../stores/financialStore';
import { usePeopleAnalyticsStore } from '../../stores/peopleAnalyticsStore';
import { generateAllMockFinancialData } from './financialMockData';
import { generateAllMockPeopleData } from './peopleAnalyticsMockData';
import type { FinancialSummary } from '../../types/financial';
import type { PeopleAnalyticsSummary } from '../../types/people-analytics';

/**
 * Load all mock data into the application stores
 * @param userId - Optional user ID (defaults to 'mock-user-123')
 */
export function loadAllMockData(userId: string = 'mock-user-123'): void {
  console.log('🎭 Loading mock data...');

  try {
    // Load Financial Data
    const financialData = generateAllMockFinancialData(userId);
    const financialStore = useFinancialStore.getState();

    financialStore.setAccounts(financialData.accounts);
    financialStore.setTransactions(financialData.transactions);
    financialStore.setCreditScores(financialData.creditScores);
    financialStore.setCreditCards(financialData.creditCards);
    financialStore.setGoals(financialData.goals);

    // Calculate and set financial summary
    const totalBalance = financialData.accounts.reduce(
      (sum, acc) => sum + acc.currentBalance,
      0
    );
    const totalIncome = financialData.transactions
      .filter((tx) => tx.transactionType === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = financialData.transactions
      .filter((tx) => tx.transactionType === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const summary: FinancialSummary = {
      totalBalance,
      totalIncome,
      totalExpenses,
      netWorth: totalBalance,
      monthlyBudget: 5000,
      budgetRemaining: 5000 - totalExpenses,
      savingsRate: ((totalIncome - totalExpenses) / totalIncome) * 100,
    };

    financialStore.setSummary(summary);

    console.log(`✅ Loaded ${financialData.accounts.length} bank accounts`);
    console.log(`✅ Loaded ${financialData.transactions.length} transactions`);
    console.log(`✅ Loaded ${financialData.creditScores.length} credit scores`);
    console.log(`✅ Loaded ${financialData.creditCards.length} credit cards`);
    console.log(`✅ Loaded ${financialData.goals.length} financial goals`);

    // Load People Analytics Data
    const peopleData = generateAllMockPeopleData();
    const peopleStore = usePeopleAnalyticsStore.getState();

    peopleStore.setPeople(peopleData.people);
    peopleStore.setInteractions(peopleData.interactions);
    peopleStore.setInsights(peopleData.insights);
    peopleStore.setSocialActivity(peopleData.socialActivity);

    // Calculate and set people analytics summary
    const activeContacts = peopleData.people.filter(
      (p) =>
        p.lastContactDate &&
        (new Date().getTime() - p.lastContactDate.getTime()) / (1000 * 60 * 60 * 24) <= 30
    ).length;

    const averageScore =
      peopleData.people.reduce((sum, p) => sum + p.relationshipScore, 0) /
      peopleData.people.length;

    const peopleSummary: PeopleAnalyticsSummary = {
      totalContacts: peopleData.people.length,
      activeContacts,
      averageRelationshipScore: Math.round(averageScore),
      totalInteractions: peopleData.interactions.length,
      interactionTrends: [],
      topRelationships: [],
      communicationPatterns: [],
    };

    peopleStore.setSummary(peopleSummary);

    // Select the first person with highest relationship score
    const topPerson = [...peopleData.people].sort(
      (a, b) => b.relationshipScore - a.relationshipScore
    )[0];
    if (topPerson) {
      peopleStore.selectPerson(topPerson);
    }

    console.log(`✅ Loaded ${peopleData.people.length} contacts`);
    console.log(`✅ Loaded ${peopleData.interactions.length} interactions`);
    console.log(`✅ Loaded ${peopleData.insights.length} relationship insights`);
    console.log(`✅ Loaded ${peopleData.socialActivity.length} social activities`);

    console.log('🎉 Mock data loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading mock data:', error);
    throw error;
  }
}

/**
 * Load only financial mock data
 */
export function loadMockFinancialData(userId: string = 'mock-user-123'): void {
  console.log('🎭 Loading financial mock data...');

  const financialData = generateAllMockFinancialData(userId);
  const financialStore = useFinancialStore.getState();

  financialStore.setAccounts(financialData.accounts);
  financialStore.setTransactions(financialData.transactions);
  financialStore.setCreditScores(financialData.creditScores);
  financialStore.setCreditCards(financialData.creditCards);
  financialStore.setGoals(financialData.goals);

  console.log('✅ Financial mock data loaded!');
}

/**
 * Load only people analytics mock data
 */
export function loadMockPeopleData(): void {
  console.log('🎭 Loading people analytics mock data...');

  const peopleData = generateAllMockPeopleData();
  const peopleStore = usePeopleAnalyticsStore.getState();

  peopleStore.setPeople(peopleData.people);
  peopleStore.setInteractions(peopleData.interactions);
  peopleStore.setInsights(peopleData.insights);
  peopleStore.setSocialActivity(peopleData.socialActivity);

  console.log('✅ People analytics mock data loaded!');
}

/**
 * Clear all mock data from stores
 */
export function clearAllMockData(): void {
  console.log('🧹 Clearing all mock data...');

  const financialStore = useFinancialStore.getState();
  financialStore.setAccounts([]);
  financialStore.setTransactions([]);
  financialStore.setCreditScores([]);
  financialStore.setCreditCards([]);
  financialStore.setGoals([]);
  financialStore.setSummary(null);

  const peopleStore = usePeopleAnalyticsStore.getState();
  peopleStore.setPeople([]);
  peopleStore.setInteractions([]);
  peopleStore.setInsights([]);
  peopleStore.setSocialActivity([]);
  peopleStore.setSummary(null);
  peopleStore.selectPerson(null);

  console.log('✅ All mock data cleared!');
}

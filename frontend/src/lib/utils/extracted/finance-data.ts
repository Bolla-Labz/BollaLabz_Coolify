// Last Modified: 2025-11-23 17:30
/**
 * Mock Finance Data
 * Sample data for development and testing
 */

import {
  CostEntry,
  CostSummary,
  BudgetAlert,
  MonthlyBudget,
  SpendingTrendDataPoint,
  ResourceCostStats,
  ResourceType,
  RESOURCE_LABELS
} from '@/types/finance';

/**
 * Generate mock cost entries
 */
export function generateMockCostEntries(count: number = 100): CostEntry[] {
  const entries: CostEntry[] = [];
  const resourceTypes: ResourceType[] = [
    'twilio_sms',
    'twilio_voice',
    'anthropic_claude',
    'vapi',
    'elevenlabs'
  ];

  const contacts = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emily Davis', 'Alex Brown'];
  const agents = ['Sales Agent', 'Support Agent', 'Booking Agent', 'Follow-up Agent'];

  for (let i = 0; i < count; i++) {
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    let amount: number;
    let description: string;

    switch (resourceType) {
      case 'twilio_sms':
        amount = 0.0079 * (Math.floor(Math.random() * 5) + 1);
        description = 'SMS message sent';
        break;
      case 'twilio_voice':
        const minutes = Math.floor(Math.random() * 10) + 1;
        amount = 0.013 * minutes;
        description = `Voice call - ${minutes} min`;
        break;
      case 'anthropic_claude':
        const tokens = Math.floor(Math.random() * 5000) + 500;
        amount = (tokens / 1000) * 0.003 + (tokens / 1000) * 0.015;
        description = `AI response - ${tokens} tokens`;
        break;
      case 'vapi':
        const vapiMinutes = Math.floor(Math.random() * 8) + 1;
        amount = 0.05 * vapiMinutes;
        description = `Vapi call - ${vapiMinutes} min`;
        break;
      case 'elevenlabs':
        const chars = Math.floor(Math.random() * 3000) + 500;
        amount = (chars / 1000) * 0.003;
        description = `Voice synthesis - ${chars} chars`;
        break;
      default:
        amount = Math.random() * 0.5;
        description = 'Other service';
    }

    entries.push({
      id: `cost-${i + 1}`,
      date,
      resourceType,
      amount,
      contactName: contacts[Math.floor(Math.random() * contacts.length)],
      agentName: agents[Math.floor(Math.random() * agents.length)],
      description
    });
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Calculate cost summary from entries
 */
export function calculateCostSummary(entries: CostEntry[]): CostSummary {
  const totalCost = entries.reduce((sum, entry) => sum + entry.amount, 0);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriodEntries = entries.filter(e => e.date >= thirtyDaysAgo);
  const previousPeriodEntries = entries.filter(
    e => e.date >= sixtyDaysAgo && e.date < thirtyDaysAgo
  );

  const periodCost = currentPeriodEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const previousPeriodCost = previousPeriodEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0
  );

  const trend =
    previousPeriodCost > 0
      ? ((periodCost - previousPeriodCost) / previousPeriodCost) * 100
      : 0;

  // Count unique conversations
  const uniqueConversations = new Set(
    currentPeriodEntries.map(e => `${e.contactName}-${e.agentName}`)
  ).size;

  const avgCostPerConversation =
    uniqueConversations > 0 ? periodCost / uniqueConversations : 0;

  // Calculate breakdown
  const breakdownMap = new Map<ResourceType, { amount: number; count: number }>();

  currentPeriodEntries.forEach(entry => {
    const existing = breakdownMap.get(entry.resourceType) || { amount: 0, count: 0 };
    breakdownMap.set(entry.resourceType, {
      amount: existing.amount + entry.amount,
      count: existing.count + 1
    });
  });

  const breakdown = Array.from(breakdownMap.entries()).map(([resourceType, data]) => ({
    resourceType,
    amount: data.amount,
    percentage: (data.amount / periodCost) * 100,
    count: data.count
  }));

  return {
    totalCost,
    periodCost,
    avgCostPerConversation,
    trend,
    breakdown
  };
}

/**
 * Generate spending trend data
 */
export function generateSpendingTrend(
  entries: CostEntry[],
  days: number = 30
): SpendingTrendDataPoint[] {
  const trendData: SpendingTrendDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const dayEntries = entries.filter(
      entry => entry.date.toISOString().split('T')[0] === dateString
    );

    const amount = dayEntries.reduce((sum, entry) => sum + entry.amount, 0);

    trendData.push({
      date: dateString,
      amount,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }

  return trendData;
}

/**
 * Generate mock budget alerts
 */
export function generateMockBudgetAlerts(): BudgetAlert[] {
  return [
    {
      id: 'alert-1',
      title: 'Monthly Budget at 85%',
      message: 'You have used $425 of your $500 monthly budget. Consider optimizing costs.',
      severity: 'warning',
      threshold: 500,
      currentValue: 425,
      percentage: 85,
      dismissible: true,
      createdAt: new Date()
    },
    {
      id: 'alert-2',
      title: 'Vapi Costs Higher Than Usual',
      message: 'Vapi spending is 45% above average this week. Review call durations.',
      severity: 'warning',
      threshold: 50,
      currentValue: 72.5,
      percentage: 145,
      dismissible: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'alert-3',
      title: 'Claude API Costs Optimized',
      message: 'Great job! Claude costs are 12% lower than last month.',
      severity: 'healthy',
      threshold: 100,
      currentValue: 88,
      percentage: 88,
      dismissible: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];
}

/**
 * Get current monthly budget
 */
export function getMockMonthlyBudget(): MonthlyBudget {
  const now = new Date();
  const budget = 500;
  const spent = 425.67;

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    budget,
    spent,
    remaining: budget - spent,
    percentageUsed: (spent / budget) * 100,
    status: 'warning'
  };
}

/**
 * Get resource cost statistics
 */
export function getMockResourceCostStats(): ResourceCostStats[] {
  return [
    {
      resourceType: 'twilio_sms',
      totalCost: 45.23,
      totalCount: 5725,
      avgCost: 0.0079,
      trend: 8.5,
      lastUpdated: new Date()
    },
    {
      resourceType: 'twilio_voice',
      totalCost: 89.45,
      totalCount: 456,
      avgCost: 0.196,
      trend: -5.2,
      lastUpdated: new Date()
    },
    {
      resourceType: 'anthropic_claude',
      totalCost: 156.78,
      totalCount: 1234,
      avgCost: 0.127,
      trend: -12.3,
      lastUpdated: new Date()
    },
    {
      resourceType: 'vapi',
      totalCost: 98.32,
      totalCount: 234,
      avgCost: 0.42,
      trend: 45.6,
      lastUpdated: new Date()
    },
    {
      resourceType: 'elevenlabs',
      totalCost: 35.89,
      totalCount: 892,
      avgCost: 0.04,
      trend: 3.2,
      lastUpdated: new Date()
    }
  ];
}

// Pre-generate mock data for use in components
export const mockCostEntries = generateMockCostEntries(100);
export const mockCostSummary = calculateCostSummary(mockCostEntries);
export const mockSpendingTrend = generateSpendingTrend(mockCostEntries, 30);
export const mockBudgetAlerts = generateMockBudgetAlerts();
export const mockMonthlyBudget = getMockMonthlyBudget();
export const mockResourceStats = getMockResourceCostStats();

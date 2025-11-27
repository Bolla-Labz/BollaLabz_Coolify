// Last Modified: 2025-11-23 17:30
/**
 * Finance Type Definitions
 * Extracted from existing backend for use with Zustand stores
 */

// Resource Types
export type ResourceType =
  | 'twilio_sms'
  | 'twilio_voice'
  | 'elevenlabs_tts'
  | 'anthropic_api'
  | 'openai_api'
  | 'google_api'
  | 'azure_api'
  | 'aws_services'
  | 'other';

// Budget Status
export type BudgetStatus = 'under' | 'warning' | 'exceeded';

// Core Finance Types
export interface CostEntry {
  id: string;
  timestamp: Date;
  resourceType: ResourceType;
  amount: number;
  currency: string;
  description?: string;
  metadata?: {
    contactId?: string;
    contactName?: string;
    agentId?: string;
    agentName?: string;
    conversationId?: string;
    duration?: number;
    messageCount?: number;
    tokens?: number;
    apiCall?: string;
  };
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CostSummary {
  totalCost: number;
  costByResource: Record<ResourceType, number>;
  costByDay: Array<{
    date: string;
    amount: number;
  }>;
  costByContact: Array<{
    contactId: string;
    contactName: string;
    amount: number;
  }>;
  costByAgent: Array<{
    agentId: string;
    agentName: string;
    amount: number;
  }>;
  averageDailyCost: number;
  projectedMonthlyCost: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CostBreakdown {
  resourceType: ResourceType;
  amount: number;
  percentage: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

export interface SpendingTrendDataPoint {
  date: string;
  total: number;
  breakdown: Record<ResourceType, number>;
  forecast?: number;
  budgetLimit?: number;
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'exceeded' | 'forecast';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold?: number;
  currentValue: number;
  timestamp: Date;
  resourceType?: ResourceType;
  dismissed?: boolean;
  actionRequired?: boolean;
  suggestedAction?: string;
}

export interface BudgetThreshold {
  id: string;
  name: string;
  type: 'monthly' | 'weekly' | 'daily' | 'resource';
  resourceType?: ResourceType;
  amount: number;
  currency: string;
  alertPercentage: number; // Alert when this % of budget is reached
  enabled: boolean;
  notificationChannels?: Array<'email' | 'sms' | 'webhook' | 'ui'>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResourceCostStats {
  resourceType: ResourceType;
  currentMonthCost: number;
  lastMonthCost: number;
  averageMonthlyCost: number;
  totalCost: number;
  usageCount: number;
  averageCostPerUse: number;
  topContacts?: Array<{
    id: string;
    name: string;
    cost: number;
  }>;
  peakUsageDay?: {
    date: string;
    cost: number;
    count: number;
  };
}

export interface MonthlyBudget {
  year: number;
  month: number;
  budgetAmount: number;
  actualAmount: number;
  status: BudgetStatus;
  remainingAmount: number;
  remainingPercentage: number;
  projectedAmount?: number;
  daysRemaining: number;
  dailyBudget: number;
  categories?: Record<ResourceType, {
    budget: number;
    actual: number;
    status: BudgetStatus;
  }>;
}

// Forecast Types
export interface CostForecast {
  date: string;
  predictedAmount: number;
  confidenceLevel: number;
  upperBound: number;
  lowerBound: number;
  basedOnDays: number;
}

// Report Types
export interface FinancialReport {
  id: string;
  name: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: CostSummary;
  breakdown: CostBreakdown[];
  trends: SpendingTrendDataPoint[];
  alerts: BudgetAlert[];
  recommendations: string[];
  generatedAt: Date;
}

// Filter Types for UI
export interface DateRange {
  start: Date;
  end: Date;
}

export interface FinanceChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}
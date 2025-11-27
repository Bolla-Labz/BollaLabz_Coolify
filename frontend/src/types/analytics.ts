// Last Modified: 2025-11-23 17:30
/**
 * Analytics Type Definitions
 *
 * Types for analytics, metrics, and dashboard data
 */

export type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsSummary {
  totalCalls: number;
  totalMessages?: number;
  totalCosts?: number;
  totalAgents?: number;
  totalConversations?: number;
  avgCallDuration?: number;
  monthlyCost?: number;
  activeContacts?: number;
  avgResponseTime?: number;
  successRate?: number;
  trends: {
    agents?: number;
    calls?: number;
    messages?: number;
    conversations?: number;
    duration?: number;
    costs?: number;
    cost?: number;
    contacts?: number;
  };
  period?: {
    start: string;
    end: string;
    label: string;
  };
}

export interface QuickStat {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

export interface CallVolumeData {
  date?: string;
  period?: string;
  inbound: number;
  outbound: number;
  total: number;
  avgDuration?: number;
}

export interface AgentPerformance {
  id?: string;
  agentId?: string;
  name?: string;
  agentName?: string;
  totalCalls: number;
  avgDuration?: number;
  avgCallDuration?: number;
  successRate: number;
  totalCost?: number;
  cost?: number;
  rating?: number;
}

export interface ConversationMetrics {
  total: number;
  active: number;
  resolved: number;
  avgLength: number;
  avgResponseTime: number;
  sentimentScore?: number;
}

export interface CostSummary {
  total: number;
  byType: {
    calls: number;
    sms: number;
    ai: number;
  };
  byAgent: Record<string, number>;
  trend: number;
  budget?: number;
  budgetUsed?: number;
}

export type ActivityEventType =
  | 'call'
  | 'message'
  | 'task'
  | 'event'
  | 'note'
  | 'call_received'
  | 'call_completed'
  | 'agent_created'
  | 'agent_updated'
  | 'sms_received'
  | 'cost_threshold'
  | 'conversation_ended';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description?: string;
  timestamp: Date;
  userId?: string;
  contactId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsFilters {
  period?: TimePeriod;
  dateRange?: DateRange;
  agentIds?: string[];
  contactIds?: string[];
  types?: string[];
}

export interface CostBreakdown {
  resource: string;
  amount: number;
  percentage: number;
  trend: number;
}

export interface ActivityData {
  date: string;
  count: number;
  status: 'active' | 'idle' | 'holiday';
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface DonutChartDataPoint {
  name: string;
  value: number;
  color: string;
}

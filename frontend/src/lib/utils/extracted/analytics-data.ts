// Last Modified: 2025-11-23 17:30
/**
 * Mock Analytics Data
 *
 * Realistic sample data for testing and development.
 * Replace with real API calls in production.
 */

import {
  AnalyticsSummary,
  ActivityEvent,
  CallVolumeData,
  AgentPerformance,
  CostBreakdown,
  ActivityData,
  TimeSeriesDataPoint,
  DonutChartDataPoint,
} from '@/types/analytics';

// ============================================================================
// Analytics Summary
// ============================================================================

export const mockAnalyticsSummary: AnalyticsSummary = {
  totalAgents: 12,
  totalCalls: 1847,
  totalConversations: 3265,
  avgCallDuration: 185, // 3 minutes 5 seconds
  monthlyCost: 2847.32,
  trends: {
    agents: 8.5, // +8.5%
    calls: 12.3, // +12.3%
    conversations: 15.7, // +15.7%
    duration: -4.2, // -4.2% (shorter = better)
    cost: 6.8, // +6.8%
  },
  period: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    label: 'Last 30 days',
  },
};

// ============================================================================
// Recent Activity Events
// ============================================================================

export const mockRecentActivity: ActivityEvent[] = [
  {
    id: '1',
    type: 'call_received',
    title: 'Incoming call from +1 (555) 123-4567',
    description: 'Agent: Sales Bot | Duration: 3m 42s',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: '2',
    type: 'agent_created',
    title: 'New agent created',
    description: 'Support Assistant v2 is now active',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: '3',
    type: 'sms_received',
    title: 'SMS received from +1 (555) 987-6543',
    description: 'Message: "Can we schedule a call tomorrow?"',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '4',
    type: 'cost_threshold',
    title: 'Cost threshold reached',
    description: '80% of monthly budget used ($2,278 of $2,850)',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: '5',
    type: 'conversation_ended',
    title: 'Conversation completed',
    description: 'Customer satisfaction: 4.5/5',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
  {
    id: '6',
    type: 'agent_updated',
    title: 'Agent configuration updated',
    description: 'Sales Bot - Voice settings modified',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    id: '7',
    type: 'call_completed',
    title: 'Call successfully completed',
    description: 'Lead qualification call | Result: Qualified',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

// ============================================================================
// Call Volume Data (Last 7 Days)
// ============================================================================

export const mockCallVolumeData: CallVolumeData[] = [
  { period: 'Mon', inbound: 42, outbound: 28, total: 70, avgDuration: 195 },
  { period: 'Tue', inbound: 38, outbound: 31, total: 69, avgDuration: 182 },
  { period: 'Wed', inbound: 51, outbound: 35, total: 86, avgDuration: 203 },
  { period: 'Thu', inbound: 45, outbound: 29, total: 74, avgDuration: 178 },
  { period: 'Fri', inbound: 48, outbound: 33, total: 81, avgDuration: 189 },
  { period: 'Sat', inbound: 25, outbound: 18, total: 43, avgDuration: 165 },
  { period: 'Sun', inbound: 22, outbound: 15, total: 37, avgDuration: 157 },
];

// ============================================================================
// Agent Performance Data
// ============================================================================

export const mockAgentPerformance: AgentPerformance[] = [
  {
    agentId: 'agent-1',
    agentName: 'Sales Bot Pro',
    totalCalls: 524,
    avgCallDuration: 218,
    successRate: 87.5,
    cost: 892.45,
    rating: 4.6,
  },
  {
    agentId: 'agent-2',
    agentName: 'Support Assistant',
    totalCalls: 412,
    avgCallDuration: 195,
    successRate: 92.1,
    cost: 678.32,
    rating: 4.8,
  },
  {
    agentId: 'agent-3',
    agentName: 'Lead Qualifier',
    totalCalls: 387,
    avgCallDuration: 168,
    successRate: 78.3,
    cost: 542.18,
    rating: 4.2,
  },
  {
    agentId: 'agent-4',
    agentName: 'Appointment Scheduler',
    totalCalls: 298,
    avgCallDuration: 142,
    successRate: 94.6,
    cost: 398.76,
    rating: 4.9,
  },
  {
    agentId: 'agent-5',
    agentName: 'Customer Onboarding',
    totalCalls: 226,
    avgCallDuration: 245,
    successRate: 85.2,
    cost: 335.61,
    rating: 4.5,
  },
];

// ============================================================================
// Cost Breakdown Data
// ============================================================================

export const mockCostBreakdown: CostBreakdown[] = [
  {
    resource: 'vapi',
    amount: 1245.67,
    percentage: 43.7,
    trend: 8.2,
  },
  {
    resource: 'twilio_voice',
    amount: 678.45,
    percentage: 23.8,
    trend: 5.4,
  },
  {
    resource: 'anthropic',
    amount: 432.18,
    percentage: 15.2,
    trend: 12.6,
  },
  {
    resource: 'elevenlabs',
    amount: 289.34,
    percentage: 10.2,
    trend: -3.1,
  },
  {
    resource: 'twilio_sms',
    amount: 142.56,
    percentage: 5.0,
    trend: 18.9,
  },
  {
    resource: 'deepgram',
    amount: 59.12,
    percentage: 2.1,
    trend: 4.7,
  },
];

// ============================================================================
// Activity Calendar Data (Current Month)
// ============================================================================

export const mockActivityCalendar: ActivityData[] = generateMonthActivity(new Date());

function generateMonthActivity(date: Date): ActivityData[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const activities: ActivityData[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();

    // Weekend logic
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      activities.push({
        date: dateStr,
        count: Math.floor(Math.random() * 5), // Lower activity on weekends
        status: 'idle',
      });
    } else {
      // Weekday logic
      const isHoliday = false; // Could check against holiday list
      if (isHoliday) {
        activities.push({
          date: dateStr,
          count: 0,
          status: 'holiday',
        });
      } else {
        activities.push({
          date: dateStr,
          count: Math.floor(Math.random() * 20) + 5, // 5-24 activities
          status: 'active',
        });
      }
    }
  }

  return activities;
}

// ============================================================================
// Time Series Data (Last 30 Days)
// ============================================================================

export const mockTimeSeriesData: TimeSeriesDataPoint[] = generateTimeSeriesData(30);

function generateTimeSeriesData(days: number): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 50) + 30, // 30-80 range
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  return data;
}

// ============================================================================
// Multi-Line Chart Data (Activity Growth)
// ============================================================================

export const mockMultiLineData = generateMultiLineData(180);

function generateMultiLineData(days: number) {
  const data: any[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: Math.floor(Math.random() * 40) + 20,
      messages: Math.floor(Math.random() * 60) + 30,
      conversations: Math.floor(Math.random() * 50) + 25,
    });
  }

  return data;
}

// ============================================================================
// Donut Chart Data (Cost Distribution)
// ============================================================================

export const mockCostDonutData: DonutChartDataPoint[] = [
  { name: 'Voice AI (Vapi)', value: 1245.67, color: '#6366F1' },
  { name: 'Phone (Twilio)', value: 678.45, color: '#8B5CF6' },
  { name: 'AI Model (Claude)', value: 432.18, color: '#EC4899' },
  { name: 'Voice Synthesis', value: 289.34, color: '#F59E0B' },
  { name: 'SMS', value: 142.56, color: '#10B981' },
  { name: 'Transcription', value: 59.12, color: '#3B82F6' },
];

// ============================================================================
// Sparkline Data (for MetricCards)
// ============================================================================

export const mockSparklineData = {
  calls: [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 38 },
    { label: 'Wed', value: 51 },
    { label: 'Thu', value: 45 },
    { label: 'Fri', value: 48 },
    { label: 'Sat', value: 25 },
    { label: 'Sun', value: 22 },
  ],
  conversations: [
    { label: 'Mon', value: 67 },
    { label: 'Tue', value: 72 },
    { label: 'Wed', value: 85 },
    { label: 'Thu', value: 78 },
    { label: 'Fri', value: 91 },
    { label: 'Sat', value: 45 },
    { label: 'Sun', value: 38 },
  ],
  cost: [
    { label: 'Mon', value: 142 },
    { label: 'Tue', value: 138 },
    { label: 'Wed', value: 165 },
    { label: 'Thu', value: 152 },
    { label: 'Fri', value: 178 },
    { label: 'Sat', value: 89 },
    { label: 'Sun', value: 76 },
  ],
};

// ============================================================================
// Helper: Get Random Data Subset
// ============================================================================

export function getRandomSubset<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ============================================================================
// Helper: Refresh Data (simulate API call)
// ============================================================================

export function refreshMockData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: mockAnalyticsSummary,
        activities: mockRecentActivity,
        callVolume: mockCallVolumeData,
        agentPerformance: mockAgentPerformance,
        costBreakdown: mockCostBreakdown,
        activityCalendar: mockActivityCalendar,
      });
    }, 500); // Simulate network delay
  });
}

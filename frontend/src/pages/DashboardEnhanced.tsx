// Last Modified: 2025-11-24 21:45
/**
 * Enhanced Dashboard Example
 * Demonstrates all new data visualization components
 * - MetricsGrid with live updates
 * - LiveActivityFeed with WebSocket
 * - KPIDashboard with real-time metrics
 * - StreamingChart for live data
 */

import React, { useState, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../components/providers/WebSocketProvider';
import { cn } from '../lib/utils';

// New Components
import { MetricsGrid, MetricData } from '../components/dashboard/MetricsGrid';
import { LiveActivityFeed, ActivityItem } from '../components/dashboard/LiveActivityFeed';
import { KPIDashboard, KPIMetric } from '../components/dashboard/KPIDashboard';
import { StreamingChart, StreamingSeries, StreamingDataPoint } from '../components/data-visualization/charts/StreamingChart';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// Icons
import {
  Users,
  MessageSquare,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Phone,
  Activity,
  Calendar,
} from 'lucide-react';

// Mock data generators
const generateMockMetrics = (): MetricData[] => [
  {
    id: 'contacts',
    title: 'Total Contacts',
    value: 247,
    previousValue: 235,
    trend: 'up',
    trendValue: 5.1,
    goal: 300,
    icon: Users,
    iconColor: 'bg-blue-500/10',
    description: 'Active phone contacts',
  },
  {
    id: 'conversations',
    title: 'Conversations',
    value: 1342,
    previousValue: 1415,
    trend: 'down',
    trendValue: -5.2,
    icon: MessageSquare,
    iconColor: 'bg-green-500/10',
    description: 'Total messages exchanged',
  },
  {
    id: 'tasks',
    title: 'Active Tasks',
    value: 23,
    previousValue: 20,
    trend: 'up',
    trendValue: 15.0,
    goal: 30,
    icon: CheckSquare,
    iconColor: 'bg-purple-500/10',
    description: 'Tasks in progress',
  },
  {
    id: 'spend',
    title: 'Monthly Spend',
    value: 45.78,
    previousValue: 39.82,
    prefix: '$',
    precision: 2,
    trend: 'up',
    trendValue: 15.0,
    icon: DollarSign,
    iconColor: 'bg-yellow-500/10',
    description: 'SMS, Voice, AI costs',
  },
];

const generateMockActivities = (): ActivityItem[] => [
  {
    id: '1',
    type: 'message',
    title: 'New message from John Doe',
    description: 'Hey, can we schedule a call for tomorrow?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'completed',
    user: {
      name: 'John Doe',
      initials: 'JD',
    },
    priority: 'normal',
    read: false,
  },
  {
    id: '2',
    type: 'task',
    title: 'Update CRM records',
    description: 'Sync contact information from recent calls',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: 'in_progress',
    progress: 65,
    priority: 'high',
    read: true,
  },
  {
    id: '3',
    type: 'call',
    title: 'Incoming call completed',
    description: 'Call from Sarah Smith - 5:23 duration',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'completed',
    user: {
      name: 'Sarah Smith',
      initials: 'SS',
    },
    priority: 'normal',
    read: true,
  },
  {
    id: '4',
    type: 'alert',
    title: 'Cost threshold warning',
    description: 'Monthly spend approaching $50 limit',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    status: 'pending',
    priority: 'urgent',
    read: false,
  },
];

const generateMockKPIs = (): KPIMetric[] => [
  {
    id: 'response-time',
    title: 'Avg Response Time',
    value: 2.3,
    unit: 'min',
    goal: 5,
    trend: 'down',
    trendPercentage: -15.2,
    sparklineData: [3.2, 3.1, 2.9, 2.8, 2.5, 2.4, 2.3],
    icon: Activity,
    color: '#10b981',
    status: 'good',
  },
  {
    id: 'engagement',
    title: 'Engagement Rate',
    value: 78,
    suffix: '%',
    goal: 85,
    trend: 'up',
    trendPercentage: 8.5,
    sparklineData: [65, 68, 72, 74, 75, 76, 78],
    icon: TrendingUp,
    color: '#3b82f6',
    status: 'good',
  },
  {
    id: 'call-success',
    title: 'Call Success Rate',
    value: 92,
    suffix: '%',
    goal: 95,
    trend: 'neutral',
    trendPercentage: 0.5,
    sparklineData: [91, 92, 91, 93, 92, 92, 92],
    icon: Phone,
    color: '#8b5cf6',
    status: 'warning',
  },
  {
    id: 'meetings',
    title: 'Meetings Scheduled',
    value: 12,
    goal: 20,
    trend: 'up',
    trendPercentage: 20.0,
    sparklineData: [8, 9, 10, 10, 11, 11, 12],
    icon: Calendar,
    color: '#f59e0b',
    status: 'good',
  },
];

const generateStreamingSeries = (): StreamingSeries[] => [
  {
    key: 'messages',
    name: 'Messages/sec',
    color: '#3b82f6',
    strokeWidth: 2,
  },
  {
    key: 'calls',
    name: 'Calls/sec',
    color: '#10b981',
    strokeWidth: 2,
  },
];

export default function DashboardEnhanced() {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();

  // State
  const [metrics] = useState<MetricData[]>(generateMockMetrics());
  const [activities] = useState<ActivityItem[]>(generateMockActivities());
  const [kpis] = useState<KPIMetric[]>(generateMockKPIs());

  // Streaming chart configuration
  const streamingSeries = useMemo(() => generateStreamingSeries(), []);

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Enhanced Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time data visualization with WebSocket streaming
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="streaming">Live Stream</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Grid */}
          <MetricsGrid
            metrics={metrics}
            columns={4}
            enableRealtime={true}
            websocketChannel="metrics:update"
            onMetricClick={(metric) => console.log('Metric clicked:', metric)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <LiveActivityFeed
                initialActivities={activities}
                maxItems={50}
                enableRealtime={true}
                websocketChannel="activity:new"
                showProgress={true}
                onActivityClick={(activity) => console.log('Activity clicked:', activity)}
              />
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today's Messages</span>
                  <span className="text-2xl font-bold">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Calls</span>
                  <span className="text-2xl font-bold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Tasks</span>
                  <span className="text-2xl font-bold">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <Badge variant="default">99.9%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <KPIDashboard
            metrics={kpis}
            enableRealtime={true}
            websocketChannel="kpi:change"
            refreshInterval={5000}
            columns={4}
            showSparklines={true}
            showProgress={true}
            onMetricClick={(metric) => console.log('KPI clicked:', metric)}
          />
        </TabsContent>

        {/* Streaming Tab */}
        <TabsContent value="streaming" className="space-y-6">
          <StreamingChart
            series={streamingSeries}
            websocketChannel="metrics:stream"
            maxDataPoints={100}
            updateInterval={1000}
            title="Real-Time Activity Stream"
            subtitle="Live metrics streaming via WebSocket"
            showControls={true}
            showStats={true}
            enableExport={true}
            height={400}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stream Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max Data Points</span>
                  <span className="font-medium">100</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Update Interval</span>
                  <span className="font-medium">1000ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">WebSocket Channel</span>
                  <span className="font-mono text-xs">metrics:stream</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'Streaming' : 'Paused'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Update Rate</span>
                  <span className="font-medium">1.0 Hz</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-medium">45ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Buffer Size</span>
                  <span className="font-medium">1000</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">FPS</span>
                  <Badge variant="default">60</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <LiveActivityFeed
            initialActivities={activities}
            maxItems={100}
            enableRealtime={true}
            websocketChannel="activity:new"
            groupByType={true}
            showProgress={true}
            onActivityClick={(activity) => console.log('Activity clicked:', activity)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Last Modified: 2025-11-24 00:00
// Interaction Trends Chart Component
// Optimized with React 18's useDeferredValue for smooth timeline visualization

import { useDeferredValue, useMemo } from 'react';
import { InteractionTrend } from '../../types/people-analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ChartLoadingOverlay, ChartSkeleton } from '@/lib/utils/chart-optimization';
import { cn } from '@/lib/utils';

interface InteractionTrendsChartProps {
  trends: InteractionTrend[];
}

export function InteractionTrendsChart({ trends }: InteractionTrendsChartProps) {
  // Use React 18's useDeferredValue for non-blocking updates
  const deferredTrends = useDeferredValue(trends);
  const isStale = trends !== deferredTrends;
  // Group trends by date (using deferred data)
  const chartData = useMemo(() => {
    const groupedData = deferredTrends.reduce((acc, trend) => {
      const dateKey = format(trend.date, 'MMM dd');

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, call: 0, sms: 0, email: 0, meeting: 0, total: 0 };
      }

      acc[dateKey][trend.type as keyof typeof acc[typeof dateKey]] = trend.count;
      acc[dateKey].total += trend.count;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedData);
  }, [deferredTrends]);

  // Calculate average
  const average = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.total, 0) / chartData.length || 0;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize">{entry.dataKey}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Daily Trends</h3>
          <p className="text-sm text-muted-foreground">
            {deferredTrends.length} interactions in the last 30 days
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="font-medium">{average.toFixed(1)} avg/day</span>
          {isStale && (
            <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          )}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="relative">
          <div className={cn('transition-opacity duration-200', isStale && 'opacity-70')}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="call"
                  stackId="a"
                  fill="#3B82F6"
                  name="Call"
                  animationDuration={isStale ? 0 : 800}
                />
                <Bar
                  dataKey="sms"
                  stackId="a"
                  fill="#10B981"
                  name="SMS"
                  animationDuration={isStale ? 0 : 800}
                />
                <Bar
                  dataKey="email"
                  stackId="a"
                  fill="#F59E0B"
                  name="Email"
                  animationDuration={isStale ? 0 : 800}
                />
                <Bar
                  dataKey="meeting"
                  stackId="a"
                  fill="#8B5CF6"
                  name="Meeting"
                  animationDuration={isStale ? 0 : 800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Loading overlay during data aggregation */}
          <ChartLoadingOverlay isVisible={isStale} />
        </div>
      ) : (
        <ChartSkeleton height={300} />
      )}
    </div>
  );
}

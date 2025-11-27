// Last Modified: 2025-11-23 17:30
// Activity Metrics Component

import { Activity } from 'lucide-react';

interface ActivityMetricsProps {
  totalTransactions: number;
  thisMonthTransactions: number;
}

export function ActivityMetrics({
  totalTransactions,
  thisMonthTransactions,
}: ActivityMetricsProps) {
  // Calculate activity percentage (mock calculation)
  const activityPercentage = Math.min(
    (thisMonthTransactions / Math.max(totalTransactions * 0.1, 1)) * 100,
    100
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Activity</h3>
        <Activity className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Circular Progress */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-secondary"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${
                2 * Math.PI * 56 * (1 - activityPercentage / 100)
              }`}
              className="text-primary transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">
              {Math.round(activityPercentage)}%
            </span>
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="pt-4 border-t space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">This Month</span>
          <span className="text-sm font-medium">{thisMonthTransactions} transactions</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-sm font-medium">{totalTransactions} transactions</span>
        </div>
      </div>
    </div>
  );
}

// Last Modified: 2025-11-23 17:30
// Budget Tracker Component

import { Target, TrendingUp } from 'lucide-react';

interface BudgetTrackerProps {
  budget: number;
  spent: number;
}

export function BudgetTracker({ budget, spent }: BudgetTrackerProps) {
  const remaining = Math.max(budget - spent, 0);
  const percentageSpent = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = spent > budget;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Budget</h3>
        <Target className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Budget Amount */}
      <div>
        <div className="text-3xl font-bold">{formatCurrency(budget)}</div>
        <p className="text-sm text-muted-foreground mt-1">Monthly Budget</p>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Spent</span>
          <span className="text-sm font-medium">{formatCurrency(spent)}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${
              isOverBudget
                ? 'bg-red-500'
                : percentageSpent < 70
                ? 'bg-green-500'
                : percentageSpent < 90
                ? 'bg-yellow-500'
                : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">
            {percentageSpent.toFixed(0)}% used
          </span>
          <span
            className={`text-xs font-medium ${
              isOverBudget ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {isOverBudget ? 'Over Budget' : `${formatCurrency(remaining)} left`}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="pt-4 border-t space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Daily Average</span>
          <span className="text-sm font-medium">
            {formatCurrency(spent / new Date().getDate())}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Projected</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatCurrency((spent / new Date().getDate()) * 30)}
            </span>
          </div>
        </div>
      </div>

      {/* Warning if over budget */}
      {isOverBudget && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            You're {formatCurrency(spent - budget)} over budget this month
          </p>
        </div>
      )}
    </div>
  );
}

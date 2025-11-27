// Last Modified: 2025-11-24 00:00
// Expense Chart Component using Recharts
// Optimized with React 18's useDeferredValue for smooth chart updates

import { useDeferredValue, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ExpenseByCategory } from '../../types/financial';
import { ChartLoadingOverlay, ChartSkeleton } from '@/lib/utils/chart-optimization';
import { cn } from '@/lib/utils';

interface ExpenseChartProps {
  expenses: ExpenseByCategory[];
}

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  // Use React 18's useDeferredValue for non-blocking updates
  const deferredExpenses = useDeferredValue(expenses);
  const isStale = expenses !== deferredExpenses;

  // Use deferred data for rendering
  const chartExpenses = deferredExpenses;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Expenses by Category</h3>
          <p className="text-sm text-muted-foreground">
            Your spending breakdown for this month
          </p>
        </div>
        {isStale && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Processing...
          </div>
        )}
      </div>

      {chartExpenses.length > 0 ? (
        <div className="relative">
          <div className={cn('flex flex-col lg:flex-row items-center gap-6 transition-opacity duration-200', isStale && 'opacity-70')}>
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2 relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartExpenses}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.percentage.toFixed(0)}%`}
                    animationDuration={isStale ? 0 : 800}
                    animationBegin={0}
                  >
                    {chartExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with amounts */}
            <div className="w-full lg:w-1/2 space-y-3">
              {chartExpenses.map((expense) => (
                <div key={expense.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: expense.color }}
                    />
                    <span className="text-sm">{expense.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {expense.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading overlay during data updates */}
          {isStale && <ChartLoadingOverlay isVisible={true} />}
        </div>
      ) : (
        <ChartSkeleton height={300} />
      )}
    </div>
  );
}

// Last Modified: 2025-11-24 10:04
import React from 'react';
import { DollarSign, TrendingUp, Phone, MessageSquare, Cpu, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  icon: React.ElementType;
  color: string;
  change: number;
}

const costData: CostBreakdown[] = [
  {
    category: 'SMS Messages',
    amount: 18.45,
    percentage: 40,
    icon: MessageSquare,
    color: 'bg-blue-500',
    change: 12
  },
  {
    category: 'Voice Calls',
    amount: 15.30,
    percentage: 34,
    icon: Phone,
    color: 'bg-green-500',
    change: -5
  },
  {
    category: 'AI Processing',
    amount: 11.03,
    percentage: 26,
    icon: Cpu,
    color: 'bg-purple-500',
    change: 8
  }
];

export function CostTracker() {
  const totalCost = costData.reduce((sum, item) => sum + item.amount, 0);
  const monthlyBudget = 100;
  const budgetUsed = (totalCost / monthlyBudget) * 100;

  return (
    <div className="@container rounded-lg border bg-card">
      <div className={cn("@sm:p-4 @md:p-6")}>
        <div className={cn("flex items-center justify-between", "@sm:mb-3 @md:mb-4")}>
          <h2 className={cn("font-semibold", "@sm:text-base @md:text-lg")}>Cost Tracker</h2>
          <div className={cn(
            "flex items-center gap-1 text-muted-foreground",
            "@sm:text-xs @md:text-sm"
          )}>
            <DollarSign className={cn("@sm:w-3 @sm:h-3 @md:w-4 @md:h-4")} />
            <span className="@sm:hidden @md:inline">This month</span>
          </div>
        </div>

        {/* Total Spending */}
        <div className={cn("@sm:mb-4 @md:mb-6")}>
          <div className={cn("flex items-baseline justify-between", "@sm:mb-1 @md:mb-2")}>
            <div>
              <span className={cn("font-bold", "@sm:text-2xl @md:text-3xl")}>${totalCost.toFixed(2)}</span>
              <span className={cn(
                "text-muted-foreground ml-2",
                "@sm:text-xs @md:text-sm"
              )}>/ ${monthlyBudget}</span>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-green-600 dark:text-green-400",
              "@sm:text-xs @md:text-sm"
            )}>
              <TrendingUp className={cn("@sm:w-3 @sm:h-3 @md:w-4 @md:h-4")} />
              <span>+8%</span>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                budgetUsed < 50 && "bg-green-500",
                budgetUsed >= 50 && budgetUsed < 80 && "bg-amber-500",
                budgetUsed >= 80 && "bg-red-500"
              )}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {budgetUsed.toFixed(0)}% of monthly budget used
          </p>
        </div>

        {/* Cost Breakdown */}
        <div className={cn("@sm:space-y-2 @md:space-y-4")}>
          <h3 className={cn("font-medium", "@sm:text-xs @md:text-sm")}>Breakdown by Category</h3>

          {costData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.category} className={cn("@sm:space-y-1 @md:space-y-2")}>
                <div className="flex items-center justify-between">
                  <div className={cn("flex items-center", "@sm:gap-1.5 @md:gap-2")}>
                    <div className={cn(
                      "rounded-lg flex items-center justify-center",
                      "@sm:w-6 @sm:h-6 @md:w-8 @md:h-8",
                      item.color.replace('bg-', 'bg-').concat('/10')
                    )}>
                      <Icon className={cn(
                        item.color.replace('bg-', 'text-'),
                        "@sm:w-3 @sm:h-3 @md:w-4 @md:h-4"
                      )} />
                    </div>
                    <div>
                      <p className={cn("font-medium", "@sm:text-xs @md:text-sm")}>{item.category}</p>
                      <p className={cn("text-muted-foreground", "@sm:text-[10px] @md:text-xs")}>
                        ${item.amount.toFixed(2)} ({item.percentage}%)
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-medium",
                    "@sm:text-[10px] @md:text-xs",
                    item.change > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={cn("h-1.5 rounded-full", item.color)}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert for high spending */}
        {budgetUsed > 75 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-400">
                High spending alert
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
                You've used {budgetUsed.toFixed(0)}% of your monthly budget. Consider reducing usage to stay within limits.
              </p>
            </div>
          </div>
        )}

        {/* Cost Optimization Tips */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs font-medium mb-1">Cost Optimization Tip</p>
          <p className="text-xs text-muted-foreground">
            Batch your SMS messages during off-peak hours to reduce costs by up to 20%.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <button className="text-sm text-primary hover:underline font-medium">
          View detailed report →
        </button>
      </div>
    </div>
  );
}
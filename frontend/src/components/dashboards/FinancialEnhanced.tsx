// Last Modified: 2025-11-23 17:30
/**
 * Enhanced Financial Dashboard
 * Integrates extracted Zustand store logic with our existing UI
 * This demonstrates how to connect the production-tested backend logic
 * with our superior UI design
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinanceStore } from '@/stores/extracted/finance';
import { formatCurrency } from '@/lib/utils/extracted/format';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Calendar,
  RefreshCcw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function EnhancedFinancialDashboard() {
  // Use the extracted finance store with all its business logic
  const {
    costSummary,
    spendingTrends,
    budgetAlerts,
    resourceStats,
    monthlyBudgets,
    isLoading,
    error,
    fetchCostSummary,
    fetchSpendingTrends,
    fetchBudgetAlerts,
    fetchResourceStats,
    fetchMonthlyBudgets,
    getFilteredEntries,
    getCostByResource,
    getCurrentMonthBudget,
    getActiveAlerts,
  } = useFinanceStore();

  // Load data on mount
  useEffect(() => {
    const loadFinancialData = async () => {
      const currentYear = new Date().getFullYear();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Parallel data fetching using the store's methods
      await Promise.all([
        fetchCostSummary({ start: thirtyDaysAgo, end: new Date() }),
        fetchSpendingTrends({ start: thirtyDaysAgo, end: new Date() }),
        fetchBudgetAlerts(),
        fetchResourceStats(),
        fetchMonthlyBudgets(currentYear),
      ]);
    };

    loadFinancialData();
  }, []);

  // Get derived state from store
  const costBreakdown = getCostByResource();
  const currentBudget = getCurrentMonthBudget();
  const activeAlerts = getActiveAlerts();

  const handleRefresh = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Promise.all([
      fetchCostSummary({ start: thirtyDaysAgo, end: new Date() }),
      fetchSpendingTrends({ start: thirtyDaysAgo, end: new Date() }),
    ]);
  };

  if (isLoading && !costSummary) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive cost tracking and budget management
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Budget Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-destructive' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                'border-l-yellow-500'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <CardTitle className="text-lg">{alert.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
                {alert.suggestedAction && (
                  <p className="text-sm mt-2 font-medium">
                    Suggested: {alert.suggestedAction}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Costs (30d)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costSummary?.totalCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg Daily: {formatCurrency(costSummary?.averageDailyCost || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Month Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentBudget?.budgetAmount || 0)}
            </div>
            <div className="mt-1">
              <div className="text-xs text-muted-foreground">
                Remaining: {currentBudget?.remainingPercentage || 0}%
              </div>
              <div className="w-full bg-secondary h-2 rounded-full mt-1">
                <div
                  className={`h-2 rounded-full ${
                    currentBudget?.status === 'exceeded' ? 'bg-destructive' :
                    currentBudget?.status === 'warning' ? 'bg-yellow-500' :
                    'bg-primary'
                  }`}
                  style={{
                    width: `${100 - (currentBudget?.remainingPercentage || 100)}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projected Monthly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costSummary?.projectedMonthlyCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current trends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resource Count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resourceStats?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active resource types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trends Chart */}
      {spendingTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending Trends</CardTitle>
            <CardDescription>Daily cost breakdown over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={spendingTrends}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                {spendingTrends[0]?.budgetLimit && (
                  <Area
                    type="monotone"
                    dataKey="budgetLimit"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    fillOpacity={0}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cost by Resource Pie Chart */}
      {costBreakdown.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Resource</CardTitle>
              <CardDescription>Resource usage distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.resourceType}: ${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Resource Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Statistics</CardTitle>
              <CardDescription>Detailed usage metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resourceStats?.slice(0, 5).map((stat) => (
                  <div key={stat.resourceType} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{stat.resourceType}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatCurrency(stat.currentMonthCost)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.usageCount} uses
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Budget Comparison */}
      {monthlyBudgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget Performance</CardTitle>
            <CardDescription>Budget vs actual spending by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyBudgets.slice(-6).map((budget) => {
                const monthName = new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
                return (
                  <div key={`${budget.year}-${budget.month}`} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{monthName}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(budget.actualAmount)} / {formatCurrency(budget.budgetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          budget.status === 'exceeded' ? 'bg-destructive' :
                          budget.status === 'warning' ? 'bg-yellow-500' :
                          'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, (budget.actualAmount / budget.budgetAmount) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedFinancialDashboard;
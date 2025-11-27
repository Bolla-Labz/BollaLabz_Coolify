// Last Modified: 2025-11-24 10:30
// Financial Dashboard - Main Component

import { useEffect, useState, useTransition } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { Card } from '../ui/card';
import { AccountBalance } from './AccountBalance';
import { ExpenseChart } from './ExpenseChart';
import { TransactionHistory } from './TransactionHistory';
import { CreditCardWidget } from './CreditCardWidget';
import { ActivityMetrics } from './ActivityMetrics';
import { BudgetTracker } from './BudgetTracker';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function FinancialDashboard() {
  const {
    accounts,
    transactions,
    creditCards,
    summary,
    isLoadingAccounts,
    getTotalBalance,
    getExpensesByCategory,
  } = useFinancialStore();

  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalBalance = getTotalBalance();
  const expensesByCategory = getExpensesByCategory();

  useEffect(() => {
    // Load financial data on mount
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setIsRefreshing(true);
      // Only load mock data if explicitly enabled
      const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';
      if (useMocks) {
        const { loadMockFinancialData } = await import('../../lib/mocks/loadMockData');
        loadMockFinancialData();
        console.log('🎭 Mock financial data loaded (VITE_USE_MOCKS=true)');
      } else {
        console.log('✅ Skipping mock data - using real API');
        // TODO: Load real financial data from API
        // await useFinancialStore.getState().fetchAccounts();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    startTransition(() => {
      loadFinancialData();
    });
  };

  const handleConnectBank = () => {
    // TODO: Implement Plaid Link
    console.log('Opening Plaid Link...');
  };

  const isLoading = isLoadingAccounts || isRefreshing;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your accounts, track expenses, and monitor your financial health
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isPending) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleConnectBank}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Bank
          </Button>
        </div>
      </div>

      {/* Pending State Indicator */}
      {isPending && !isLoading && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Updating financial data...
        </div>
      )}

      {/* Top Stats Row */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-200",
        isPending && "opacity-60"
      )}>
        {/* Account Balance */}
        <Card className="p-6">
          <AccountBalance balance={totalBalance} accounts={accounts} />
        </Card>

        {/* Credit Cards */}
        <Card className="p-6">
          <CreditCardWidget cards={creditCards} />
        </Card>

        {/* Activity Metrics */}
        <Card className="p-6">
          <ActivityMetrics
            totalTransactions={transactions.length}
            thisMonthTransactions={transactions.filter(
              (tx) =>
                tx.transactionDate.getMonth() === new Date().getMonth()
            ).length}
          />
        </Card>
      </div>

      {/* Main Content Row */}
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-200",
        isPending && "opacity-60"
      )}>
        {/* Expense Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 p-6">
          <ExpenseChart expenses={expensesByCategory} />
        </Card>

        {/* Budget Tracker */}
        <Card className="p-6">
          <BudgetTracker
            budget={summary?.monthlyBudget || 0}
            spent={summary?.totalExpenses || 0}
          />
        </Card>
      </div>

      {/* Transaction History - Full Width */}
      <Card className={cn(
        "p-6 transition-opacity duration-200",
        isPending && "opacity-60"
      )}>
        <TransactionHistory transactions={transactions} />
      </Card>
    </div>
  );
}

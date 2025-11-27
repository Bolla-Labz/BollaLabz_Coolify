// Last Modified: 2025-11-23 17:30
// Credit Score Dashboard - Main Component

import { useEffect } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { Card } from '../ui/card';
import { CreditScoreWidget } from './CreditScoreWidget';
import { CreditUtilizationChart } from './CreditUtilizationChart';
import { PaymentHistory } from './PaymentHistory';
import { CreditRecommendations } from './CreditRecommendations';
import { CreditAlerts } from './CreditAlerts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';

export function CreditScoreDashboard() {
  const {
    creditScores,
    creditCards,
    isLoadingCredit,
    getLatestCreditScore,
  } = useFinancialStore();

  const latestScore = getLatestCreditScore();

  useEffect(() => {
    // Load credit data on mount
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    // Only load mock data if explicitly enabled
    const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';
    if (useMocks) {
      const { loadMockFinancialData } = await import('../../lib/mocks/loadMockData');
      loadMockFinancialData();
      console.log('🎭 Mock credit data loaded (VITE_USE_MOCKS=true)');
    } else {
      console.log('✅ Skipping mock data - using real API');
      // TODO: Load real credit data from API
      // await useFinancialStore.getState().fetchCreditData();
    }
  };

  const handleRefresh = async () => {
    // TODO: Implement refresh functionality
    console.log('Refreshing credit data...');
  };

  // Calculate total credit utilization
  const totalCredit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const usedCredit = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const utilization = totalCredit > 0 ? (usedCredit / totalCredit) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Score Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your credit health and get personalized recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingCredit}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCredit ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Improve Score
          </Button>
        </div>
      </div>

      {/* Credit Score and Utilization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Score Widget */}
        <Card className="p-6">
          <CreditScoreWidget score={latestScore} />
        </Card>

        {/* Credit Utilization */}
        <Card className="p-6">
          <CreditUtilizationChart
            totalCredit={totalCredit}
            usedCredit={usedCredit}
            utilization={utilization}
            cards={creditCards}
          />
        </Card>
      </div>

      {/* Payment History and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History - Takes 2 columns */}
        <Card className="lg:col-span-2 p-6">
          <PaymentHistory score={latestScore} />
        </Card>

        {/* Credit Alerts */}
        <Card className="p-6">
          <CreditAlerts score={latestScore} utilization={utilization} />
        </Card>
      </div>

      {/* Recommendations - Full Width */}
      <Card className="p-6">
        <CreditRecommendations score={latestScore} utilization={utilization} />
      </Card>
    </div>
  );
}

// Last Modified: 2025-11-23 17:30
// Credit Utilization Chart Component

import { CreditCard } from '../../types/financial';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CreditCard as CreditCardIcon } from 'lucide-react';

interface CreditUtilizationChartProps {
  totalCredit: number;
  usedCredit: number;
  utilization: number;
  cards: CreditCard[];
}

export function CreditUtilizationChart({
  totalCredit,
  usedCredit,
  utilization,
  cards,
}: CreditUtilizationChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const availableCredit = totalCredit - usedCredit;

  const chartData = [
    { name: 'Used', value: usedCredit, color: '#EF4444' },
    { name: 'Available', value: availableCredit, color: '#10B981' },
  ];

  const getUtilizationStatus = () => {
    if (utilization < 30) return { text: 'Excellent', color: 'text-green-600' };
    if (utilization < 50) return { text: 'Good', color: 'text-blue-600' };
    if (utilization < 70) return { text: 'Fair', color: 'text-yellow-600' };
    return { text: 'High', color: 'text-red-600' };
  };

  const status = getUtilizationStatus();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Credit Utilization</h3>
        <p className="text-sm text-muted-foreground">
          {utilization.toFixed(1)}% of available credit
        </p>
      </div>

      {totalCredit > 0 ? (
        <>
          {/* Chart and Stats */}
          <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Credit</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCredit)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Used</p>
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(usedCredit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(availableCredit)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`text-sm font-semibold ${status.color}`}>
                  {status.text}
                </span>
              </div>
            </div>
          </div>

          {/* Credit Cards List */}
          <div className="pt-4 border-t space-y-3">
            <h4 className="text-sm font-medium">Credit Cards</h4>
            {cards.map((card) => {
              const cardUtilization = (card.currentBalance / card.creditLimit) * 100;
              return (
                <div key={card.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{card.cardName}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {cardUtilization.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        cardUtilization < 30
                          ? 'bg-green-500'
                          : cardUtilization < 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(cardUtilization, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <CreditCardIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No credit cards found</p>
        </div>
      )}
    </div>
  );
}

// Last Modified: 2025-11-23 17:30
// Credit Card Widget Component

import { CreditCard } from '../../types/financial';
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface CreditCardWidgetProps {
  cards: CreditCard[];
}

export function CreditCardWidget({ cards }: CreditCardWidgetProps) {
  const activeCard = cards.find((c) => c.isActive) || cards[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCardGradient = (type: string) => {
    const gradients: Record<string, string> = {
      visa: 'from-blue-500 to-blue-700',
      mastercard: 'from-red-500 to-orange-600',
      amex: 'from-green-500 to-teal-600',
      discover: 'from-orange-500 to-red-600',
      other: 'from-gray-500 to-gray-700',
    };

    return gradients[type] || gradients.other;
  };

  if (!activeCard) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">My Card</h3>
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
          <CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">No credit cards connected</p>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>
      </div>
    );
  }

  const utilization = (activeCard.currentBalance / activeCard.creditLimit) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">My Card</h3>
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Credit Card Visual */}
      <div
        className={`relative rounded-xl bg-gradient-to-br ${getCardGradient(
          activeCard.cardType
        )} p-6 text-white shadow-lg`}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-sm opacity-80">Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(activeCard.currentBalance)}</p>
          </div>
          <CreditCardIcon className="h-8 w-8 opacity-80" />
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs opacity-80 mb-1">Card Number</p>
            <p className="text-lg font-mono">•••• {activeCard.lastFourDigits}</p>
          </div>
          <div className="text-xs uppercase opacity-80">{activeCard.cardType}</div>
        </div>
      </div>

      {/* Card Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Credit Limit</p>
          <p className="text-sm font-medium">{formatCurrency(activeCard.creditLimit)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Available</p>
          <p className="text-sm font-medium">{formatCurrency(activeCard.availableCredit)}</p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-muted-foreground">Utilization</p>
          <p className="text-xs font-medium">{utilization.toFixed(1)}%</p>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              utilization < 30
                ? 'bg-green-500'
                : utilization < 70
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

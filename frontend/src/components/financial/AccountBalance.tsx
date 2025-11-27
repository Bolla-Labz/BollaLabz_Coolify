// Last Modified: 2025-11-23 17:30
// Account Balance Component

import { BankAccount } from '../../types/financial';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface AccountBalanceProps {
  balance: number;
  accounts: BankAccount[];
}

export function AccountBalance({ balance, accounts }: AccountBalanceProps) {
  const activeAccounts = accounts.filter((a) => a.isActive);

  // Calculate trend (mock for now)
  const trend = 5.2; // percentage
  const isPositive = trend >= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
        <DollarSign className="h-5 w-5 text-muted-foreground" />
      </div>

      <div>
        <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
        <div className="flex items-center gap-2 mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-sm ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}{trend}%
          </span>
          <span className="text-sm text-muted-foreground">vs last month</span>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="text-sm text-muted-foreground mb-2">
          Connected Accounts
        </div>
        <div className="space-y-2">
          {activeAccounts.slice(0, 3).map((account) => (
            <div key={account.id} className="flex justify-between items-center">
              <span className="text-sm">{account.institutionName}</span>
              <span className="text-sm font-medium">
                {formatCurrency(account.currentBalance)}
              </span>
            </div>
          ))}
          {activeAccounts.length > 3 && (
            <div className="text-sm text-muted-foreground">
              +{activeAccounts.length - 3} more accounts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

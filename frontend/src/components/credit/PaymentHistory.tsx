// Last Modified: 2025-11-23 17:30
// Payment History Component

import { CreditScore } from '../../types/financial';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PaymentHistoryProps {
  score: CreditScore | null;
}

export function PaymentHistory({ score }: PaymentHistoryProps) {
  // Mock payment history data
  const paymentHistory = [
    { month: 'Jan', onTime: 5, late: 0, score: 720 },
    { month: 'Feb', onTime: 5, late: 0, score: 725 },
    { month: 'Mar', onTime: 5, late: 0, score: 730 },
    { month: 'Apr', onTime: 4, late: 1, score: 728 },
    { month: 'May', onTime: 5, late: 0, score: 732 },
    { month: 'Jun', onTime: 5, late: 0, score: score?.score || 736 },
  ];

  const paymentHistoryPercentage = score?.paymentHistoryPercentage || 95;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.month}</p>
          <p className="text-sm text-green-600">On-time: {data.onTime}</p>
          {data.late > 0 && (
            <p className="text-sm text-red-600">Late: {data.late}</p>
          )}
          <p className="text-sm text-muted-foreground">Score: {data.score}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment History</h3>
        <p className="text-sm text-muted-foreground">
          {paymentHistoryPercentage}% on-time payments
        </p>
      </div>

      {/* Score Trend Chart */}
      <div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={paymentHistory}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              domain={[700, 750]}
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-600">28</p>
          <p className="text-xs text-muted-foreground">On-time</p>
        </div>

        <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <XCircle className="h-8 w-8 text-red-600 mb-2" />
          <p className="text-2xl font-bold text-red-600">2</p>
          <p className="text-xs text-muted-foreground">Late</p>
        </div>

        <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Clock className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-600">0</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-4">Recent Payments</h4>
        <div className="space-y-3">
          {[
            { date: 'Jun 15, 2025', status: 'on-time', creditor: 'Credit Card 1', amount: '$250' },
            { date: 'Jun 10, 2025', status: 'on-time', creditor: 'Auto Loan', amount: '$450' },
            { date: 'May 15, 2025', status: 'on-time', creditor: 'Credit Card 2', amount: '$180' },
          ].map((payment, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {payment.status === 'on-time' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{payment.creditor}</p>
                <p className="text-xs text-muted-foreground">{payment.date}</p>
              </div>
              <div className="text-sm font-medium">{payment.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

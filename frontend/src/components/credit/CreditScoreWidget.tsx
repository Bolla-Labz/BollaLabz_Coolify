// Last Modified: 2025-11-23 17:30
// Credit Score Widget Component

import { CreditScore } from '../../types/financial';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

interface CreditScoreWidgetProps {
  score: CreditScore | null;
}

export function CreditScoreWidget({ score }: CreditScoreWidgetProps) {
  if (!score) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Award className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No credit score data available</p>
      </div>
    );
  }

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 800) return 'text-green-600';
    if (scoreValue >= 740) return 'text-blue-600';
    if (scoreValue >= 670) return 'text-yellow-600';
    if (scoreValue >= 580) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreRating = (scoreValue: number) => {
    if (scoreValue >= 800) return 'Exceptional';
    if (scoreValue >= 740) return 'Very Good';
    if (scoreValue >= 670) return 'Good';
    if (scoreValue >= 580) return 'Fair';
    return 'Poor';
  };

  const getScoreProgress = (scoreValue: number) => {
    return ((scoreValue - 300) / (850 - 300)) * 100;
  };

  // Mock trend for now
  const trend = 12; // points
  const isPositive = trend >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Credit Score</h3>
        <p className="text-sm text-muted-foreground">
          from {score.bureau}
        </p>
      </div>

      {/* Score Display */}
      <div className="flex flex-col items-center py-8">
        {/* Circular Progress */}
        <div className="relative w-48 h-48">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-secondary"
            />
            {/* Progress Circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${
                2 * Math.PI * 88 * (1 - getScoreProgress(score.score) / 100)
              }`}
              className={`${getScoreColor(score.score)} transition-all duration-500`}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${getScoreColor(score.score)}`}>
              {score.score}
            </span>
            <span className="text-sm text-muted-foreground">/900</span>
            <span className="text-sm font-medium mt-2">
              {getScoreRating(score.score)}
            </span>
          </div>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2 mt-4">
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}{trend} points
          </span>
          <span className="text-sm text-muted-foreground">vs last month</span>
        </div>
      </div>

      {/* Score Range */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>300</span>
          <span>850</span>
        </div>
        <div className="relative w-full h-3 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-emerald-500 rounded-full">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg"
            style={{ left: `${getScoreProgress(score.score)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Accounts</p>
          <p className="text-lg font-semibold">{score.totalAccounts || 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Open Accounts</p>
          <p className="text-lg font-semibold">{score.openAccounts || 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Hard Inquiries</p>
          <p className="text-lg font-semibold">{score.hardInquiries || 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Account Age</p>
          <p className="text-lg font-semibold">
            {score.averageAccountAgeMonths
              ? `${Math.floor(score.averageAccountAgeMonths / 12)}y`
              : '0y'}
          </p>
        </div>
      </div>
    </div>
  );
}

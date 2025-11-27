// Last Modified: 2025-11-23 17:30
// Analytics Header Component with Key Metrics

import { PeopleAnalyticsSummary } from '../../types/people-analytics';
import { Users, TrendingUp, MessageCircle, Award } from 'lucide-react';

interface AnalyticsHeaderProps {
  summary: PeopleAnalyticsSummary | null;
  totalContacts: number;
}

export function AnalyticsHeader({ summary, totalContacts }: AnalyticsHeaderProps) {
  const metrics = [
    {
      label: 'Complexity Rank',
      value: '1.17',
      change: '+20%',
      icon: Award,
      rank: '21 of 131',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      label: 'Total Contacts',
      value: totalContacts.toString(),
      change: '+11%',
      icon: Users,
      rank: `$${totalContacts}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Active Relationships',
      value: (summary?.activeContacts || 0).toString(),
      change: '-8%',
      icon: TrendingUp,
      rank: `$${summary?.activeContacts || 0}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      label: 'Interactions This Month',
      value: (summary?.totalInteractions || 0).toString(),
      change: '+15%',
      icon: MessageCircle,
      rank: `${summary?.totalInteractions || 0} total`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
  ];

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={`p-4 rounded-lg border ${metric.bgColor}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-sm text-muted-foreground">{metric.rank}</p>
              </div>
              <Icon className={`h-5 w-5 ${metric.color}`} />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{metric.value}</p>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  metric.change.startsWith('+')
                    ? 'bg-green-100 dark:bg-green-950'
                    : 'bg-red-100 dark:bg-red-950'
                } ${getChangeColor(metric.change)}`}
              >
                {metric.change}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

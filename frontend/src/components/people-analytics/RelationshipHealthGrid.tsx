// Last Modified: 2025-11-23 17:30
// Relationship Health Grid Component

import { RelationshipHealthMetric } from '../../types/people-analytics';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Badge } from '../ui/badge';

interface RelationshipHealthGridProps {
  metrics: RelationshipHealthMetric[];
}

export function RelationshipHealthGrid({ metrics }: RelationshipHealthGridProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'declining':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Relationship Health</h3>
        <p className="text-sm text-muted-foreground">
          Monitor your relationship strength and engagement
        </p>
      </div>

      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.slice(0, 6).map((metric) => (
            <div
              key={metric.personId}
              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{metric.personName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {metric.daysSinceLastContact} days ago
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.trend)}
                  <Badge variant="secondary" className={getTrendColor(metric.trend)}>
                    {metric.trend}
                  </Badge>
                </div>
              </div>

              {/* Score Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Health Score</span>
                  <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metric.score >= 80
                        ? 'bg-green-500'
                        : metric.score >= 60
                        ? 'bg-blue-500'
                        : metric.score >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-muted-foreground">
                {metric.recommendation}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No relationship data available</p>
        </div>
      )}
    </div>
  );
}

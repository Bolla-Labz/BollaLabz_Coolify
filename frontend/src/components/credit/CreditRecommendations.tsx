// Last Modified: 2025-11-23 17:30
// Credit Recommendations Component

import { CreditScore } from '../../types/financial';
import { Lightbulb, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface CreditRecommendationsProps {
  score: CreditScore | null;
  utilization: number;
}

export function CreditRecommendations({ score, utilization }: CreditRecommendationsProps) {
  const recommendations = [
    {
      type: 'increase_limit',
      title: 'Request a Credit Limit Increase',
      description:
        'With your current payment history, you may qualify for a credit limit increase. This can improve your utilization ratio.',
      potentialImpact: 15,
      priority: 'high' as const,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      show: utilization > 30,
    },
    {
      type: 'pay_balance',
      title: 'Pay Down High-Balance Cards',
      description:
        'Reducing your credit card balances below 30% utilization can significantly improve your score.',
      potentialImpact: 25,
      priority: 'high' as const,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      show: utilization > 50,
    },
    {
      type: 'reduce_usage',
      title: 'Monitor Your Credit Utilization',
      description:
        'Keep your credit utilization below 30% on all cards. Consider setting up balance alerts.',
      potentialImpact: 10,
      priority: 'medium' as const,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      show: utilization > 30 && utilization <= 50,
    },
    {
      type: 'dispute_error',
      title: 'Review Your Credit Report',
      description:
        'Regularly check for errors or unauthorized accounts. Disputing errors can quickly boost your score.',
      potentialImpact: 20,
      priority: 'medium' as const,
      icon: Lightbulb,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      show: true,
    },
  ];

  const visibleRecommendations = recommendations.filter((rec) => rec.show);

  const getPriorityBadge = (priority: string): { variant: any; label: string } => {
    const variants: Record<string, { variant: any; label: string }> = {
      high: { variant: 'destructive', label: 'High Priority' },
      medium: { variant: 'default', label: 'Medium Priority' },
      low: { variant: 'secondary', label: 'Low Priority' },
    };

    return variants[priority] || variants.medium!;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
        <p className="text-sm text-muted-foreground">
          Personalized tips to improve your credit score
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleRecommendations.map((rec) => {
          const Icon = rec.icon;
          const priorityBadge = getPriorityBadge(rec.priority);

          return (
            <div
              key={rec.type}
              className={`p-6 rounded-lg border ${rec.bgColor}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 ${rec.color}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant={priorityBadge.variant} className="text-xs">
                        {priorityBadge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      +{rec.potentialImpact} points potential
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Quick Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Pay all bills on time - payment history is 35% of your score</li>
              <li>Keep credit utilization below 30% across all cards</li>
              <li>Don't close old credit accounts - age matters</li>
              <li>Limit hard inquiries when shopping for credit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

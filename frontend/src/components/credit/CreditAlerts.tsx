// Last Modified: 2025-11-23 17:30
// Credit Alerts Component

import { CreditScore } from '../../types/financial';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Badge } from '../ui/badge';

interface CreditAlertsProps {
  score: CreditScore | null;
  utilization: number;
}

export function CreditAlerts({ score, utilization }: CreditAlertsProps) {
  const alerts = [
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'High Credit Utilization',
      description: `Your credit utilization is at ${utilization.toFixed(0)}%. Try to keep it below 30%.`,
      show: utilization > 50,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      type: 'info',
      icon: Info,
      title: 'Moderate Utilization',
      description: 'Your credit utilization is good, but could be improved for a better score.',
      show: utilization > 30 && utilization <= 50,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    },
    {
      type: 'success',
      icon: CheckCircle,
      title: 'Excellent Utilization',
      description: 'Your credit utilization is excellent! Keep it up.',
      show: utilization <= 30,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      type: 'info',
      icon: Info,
      title: 'Credit Score Updated',
      description: score
        ? `Your ${score.bureau} score was last updated on ${new Date(score.scoreDate).toLocaleDateString()}.`
        : 'Connect your credit bureau to see your latest score.',
      show: true,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'Hard Inquiry Detected',
      description: `You have ${score?.hardInquiries || 0} hard inquiries. Multiple inquiries can lower your score.`,
      show: (score?.hardInquiries || 0) > 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
  ];

  const visibleAlerts = alerts.filter((alert) => alert.show);

  const getAlertBadge = (type: string): { variant: any; label: string } => {
    const badges: Record<string, { variant: any; label: string }> = {
      warning: { variant: 'destructive', label: 'Alert' },
      success: { variant: 'default', label: 'Good' },
      info: { variant: 'secondary', label: 'Info' },
    };

    return badges[type] || badges.info!;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Alerts</h3>
      </div>

      <div className="space-y-3">
        {visibleAlerts.length > 0 ? (
          visibleAlerts.map((alert, index) => {
            const Icon = alert.icon;
            const badge = getAlertBadge(alert.type);

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${alert.bgColor}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${alert.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mb-2" />
            <p className="text-sm">No alerts at this time</p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="pt-4 border-t">
        <button className="text-sm text-primary hover:underline">
          Manage Alert Preferences
        </button>
      </div>
    </div>
  );
}

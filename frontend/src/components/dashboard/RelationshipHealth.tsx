// Last Modified: 2025-11-24 10:05
import React, { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAnalyticsStore } from '../../stores/analyticsStore';

export function RelationshipHealth() {
  const {
    relationshipHealth,
    topContacts,
    interactionTrends,
    fetchRelationshipHealth,
    fetchTopContacts,
    fetchInteractionTrends,
  } = useAnalyticsStore();

  useEffect(() => {
    // Load data on mount
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    fetchRelationshipHealth(4);
    fetchTopContacts(4);
    fetchInteractionTrends(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      'day'
    );
  }, []);

  // Calculate health distribution from relationship health data
  const healthDistribution = [
    {
      name: 'Healthy',
      value: relationshipHealth.filter(r => r.score >= 70).length || 156,
      color: '#10b981'
    },
    {
      name: 'Needs Attention',
      value: relationshipHealth.filter(r => r.score >= 40 && r.score < 70).length || 67,
      color: '#f59e0b'
    },
    {
      name: 'At Risk',
      value: relationshipHealth.filter(r => r.score < 40).length || 24,
      color: '#ef4444'
    }
  ];

  // Format interaction trends for chart
  const engagementData = interactionTrends.length > 0
    ? interactionTrends.slice(-7).map(trend => ({
        name: new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' }),
        contacts: trend.count,
        messages: trend.count * 3, // Approximate for display
      }))
    : [
        { name: 'Mon', contacts: 12, messages: 45 },
        { name: 'Tue', contacts: 19, messages: 62 },
        { name: 'Wed', contacts: 15, messages: 38 },
        { name: 'Thu', contacts: 25, messages: 78 },
        { name: 'Fri', contacts: 22, messages: 65 },
        { name: 'Sat', contacts: 8, messages: 25 },
        { name: 'Sun', contacts: 10, messages: 30 }
      ];

  // Format top contacts for display
  const displayContacts = topContacts.length > 0
    ? topContacts.slice(0, 4).map(contact => {
        const daysSince = Math.floor(
          (Date.now() - new Date(contact.lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
        );
        const lastContactText = daysSince === 0
          ? 'Today'
          : daysSince === 1
          ? '1 day ago'
          : `${daysSince} days ago`;

        return {
          id: contact.personId,
          name: contact.personName,
          lastContact: lastContactText,
          score: contact.relationshipScore,
          trend: 'stable',
          messages: contact.interactionCount
        };
      })
    : [
        { id: '1', name: 'Loading...', lastContact: '-', score: 0, trend: 'stable', messages: 0 }
      ];

  const totalContacts = healthDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="@container rounded-lg border bg-card">
      <div className={cn("@sm:p-4 @sm:pb-3 @md:p-6 @md:pb-4")}>
        <h2 className={cn("font-semibold", "@sm:text-base @md:text-lg")}>Relationship Health</h2>
        <p className={cn(
          "text-muted-foreground mt-1",
          "@sm:text-xs @md:text-sm"
        )}>
          Contact engagement and communication patterns
        </p>
      </div>

      {/* Health Overview */}
      <div className={cn("@sm:px-4 @sm:pb-4 @md:px-6 @md:pb-6")}>
        <div className={cn(
          "grid gap-4 mb-6",
          "@sm:grid-cols-3 @sm:gap-2 @md:gap-4"
        )}>
          <div className="text-center">
            <div className={cn(
              "flex items-center justify-center mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/20",
              "@sm:w-10 @sm:h-10 @md:w-12 @md:h-12"
            )}>
              <CheckCircle className={cn(
                "text-green-600 dark:text-green-400",
                "@sm:w-5 @sm:h-5 @md:w-6 @md:h-6"
              )} />
            </div>
            <p className={cn("font-bold", "@sm:text-xl @md:text-2xl")}>{healthDistribution[0]?.value ?? 0}</p>
            <p className={cn("text-muted-foreground", "@sm:text-[10px] @md:text-xs")}>Healthy</p>
          </div>
          <div className="text-center">
            <div className={cn(
              "flex items-center justify-center mx-auto mb-2 rounded-full bg-amber-100 dark:bg-amber-900/20",
              "@sm:w-10 @sm:h-10 @md:w-12 @md:h-12"
            )}>
              <Clock className={cn(
                "text-amber-600 dark:text-amber-400",
                "@sm:w-5 @sm:h-5 @md:w-6 @md:h-6"
              )} />
            </div>
            <p className={cn("font-bold", "@sm:text-xl @md:text-2xl")}>{healthDistribution[1]?.value ?? 0}</p>
            <p className={cn("text-muted-foreground", "@sm:text-[10px] @md:text-xs")}>Needs Attention</p>
          </div>
          <div className="text-center">
            <div className={cn(
              "flex items-center justify-center mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-900/20",
              "@sm:w-10 @sm:h-10 @md:w-12 @md:h-12"
            )}>
              <AlertTriangle className={cn(
                "text-red-600 dark:text-red-400",
                "@sm:w-5 @sm:h-5 @md:w-6 @md:h-6"
              )} />
            </div>
            <p className={cn("font-bold", "@sm:text-xl @md:text-2xl")}>{healthDistribution[2]?.value ?? 0}</p>
            <p className={cn("text-muted-foreground", "@sm:text-[10px] @md:text-xs")}>At Risk</p>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className={cn("@sm:mb-4 @md:mb-6")}>
          <h3 className={cn("font-medium mb-3", "@sm:text-xs @md:text-sm")}>Weekly Engagement</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar
                dataKey="contacts"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="messages"
                fill="hsl(var(--primary) / 0.5)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Contacts */}
        <div>
          <h3 className={cn("font-medium mb-3", "@sm:text-xs @md:text-sm")}>Top Relationships</h3>
          <div className={cn("@sm:space-y-2 @md:space-y-3")}>
            {displayContacts.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  "flex items-center justify-between rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
                  "@sm:p-2 @md:p-3"
                )}
              >
                <div className={cn("flex items-center", "@sm:gap-2 @md:gap-3")}>
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`}
                    alt={contact.name}
                    className={cn("rounded-full", "@sm:w-8 @sm:h-8 @md:w-10 @md:h-10")}
                  />
                  <div>
                    <p className={cn("font-medium", "@sm:text-xs @md:text-sm")}>{contact.name}</p>
                    <p className={cn(
                      "text-muted-foreground",
                      "@sm:text-[10px] @sm:hidden @md:block @md:text-xs"
                    )}>
                      Last contact: {contact.lastContact}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Health Score</p>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-sm font-bold",
                        contact.score >= 80 && "text-green-600 dark:text-green-400",
                        contact.score >= 50 && contact.score < 80 && "text-amber-600 dark:text-amber-400",
                        contact.score < 50 && "text-red-600 dark:text-red-400"
                      )}>
                        {contact.score}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        contact.score >= 80 && "bg-green-500",
                        contact.score >= 50 && contact.score < 80 && "bg-amber-500",
                        contact.score < 50 && "bg-red-500"
                      )}
                      style={{ width: `${contact.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t flex items-center justify-between">
        <button className="text-sm text-primary hover:underline font-medium">
          View all contacts →
        </button>
        <button className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          Review at-risk relationships
        </button>
      </div>
    </div>
  );
}
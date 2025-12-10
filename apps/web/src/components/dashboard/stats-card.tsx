"use client";

import type { ReactNode } from "react";

// Icon components
const TrendUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

const TrendDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
  </svg>
);

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  loading = false,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  if (loading) {
    return (
      <div className="p-6 bg-card rounded-xl border border-border">
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-muted rounded mb-4" />
          <div className="h-8 w-20 bg-muted rounded mb-2" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-card-foreground mt-2">{value}</p>

          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendUpIcon className="h-4 w-4 text-success" />
              ) : (
                <TrendDownIcon className="h-4 w-4 text-destructive" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? "text-success" : "text-destructive"
                }`}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-sm text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>

        {icon && (
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid container for stats cards
export function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {children}
    </div>
  );
}

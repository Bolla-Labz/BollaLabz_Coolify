// Last Modified: 2025-11-24 17:05
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export const StatsCard = React.memo<StatsCardProps>(function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  description,
  valueClassName,
  onClick
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const isPositive = trend === 'up';

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card transition-all",
        "@container @sm:p-4 @md:p-6",
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />

      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={cn(
            "rounded-lg bg-primary/10 p-2",
            "@sm:p-1.5 @md:p-2"
          )}>
            <Icon className={cn(
              "text-primary",
              "@sm:h-4 @sm:w-4 @md:h-5 @md:w-5"
            )} />
          </div>

          {change !== undefined && trend !== 'neutral' && (
            <div className={cn(
              "flex items-center gap-1 font-medium",
              "@sm:text-[10px] @md:text-xs",
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        <div className={cn("mt-4", "@sm:mt-2 @md:mt-4")}>
          <p className={cn(
            "font-medium text-muted-foreground",
            "@sm:text-xs @md:text-sm"
          )}>{title}</p>
          <p className={cn(
            "font-bold tracking-tight mt-1",
            "@sm:text-xl @md:text-2xl @lg:text-3xl",
            valueClassName
          )}>
            {value}
          </p>

          {description && (
            <p className={cn(
              "text-xs text-muted-foreground mt-2",
              "@sm:hidden @md:block"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
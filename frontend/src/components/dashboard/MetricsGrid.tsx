// Last Modified: 2025-11-24 21:15
/**
 * MetricsGrid Component
 * Enhanced metrics display with Statistic-style components
 * Features:
 * - Real-time WebSocket updates
 * - Animated value changes (countup/countdown)
 * - Trend indicators with arrows and percentages
 * - Responsive grid layout
 * - Performance optimized with React.memo
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// ============================================
// TYPES
// ============================================

export interface MetricData {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  precision?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  goal?: number;
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  loading?: boolean;
}

export interface MetricsGridProps {
  metrics: MetricData[];
  columns?: 1 | 2 | 3 | 4;
  enableRealtime?: boolean;
  websocketChannel?: string;
  onMetricClick?: (metric: MetricData) => void;
  className?: string;
}

// ============================================
// ANIMATED NUMBER COMPONENT
// ============================================

interface AnimatedNumberProps {
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  precision?: number;
  duration?: number;
  className?: string;
}

const AnimatedNumber = memo(function AnimatedNumber({
  value,
  previousValue,
  prefix = '',
  suffix = '',
  precision = 0,
  duration = 1000,
  className
}: AnimatedNumberProps) {
  const spring = useSpring(previousValue ?? value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const display = useTransform(spring, (current) => {
    const formatted = current.toFixed(precision);
    return `${prefix}${formatted}${suffix}`;
  });

  return (
    <motion.span
      className={cn('font-bold', className)}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.3 }}
      key={value}
    >
      {display.get()}
    </motion.span>
  );
});

// ============================================
// TREND INDICATOR COMPONENT
// ============================================

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
  value?: number;
  precision?: number;
}

const TrendIndicator = memo(function TrendIndicator({
  trend,
  value,
  precision = 1
}: TrendIndicatorProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'down':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const Icon = getTrendIcon();

  if (value === undefined || value === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        getTrendColor()
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{Math.abs(value).toFixed(precision)}%</span>
    </motion.div>
  );
});

// ============================================
// METRIC CARD COMPONENT
// ============================================

interface MetricCardProps {
  metric: MetricData;
  onClick?: () => void;
}

const MetricCard = memo(function MetricCard({ metric, onClick }: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = metric.icon || Activity;

  // Calculate progress if goal is set
  const progress = metric.goal ? (metric.value / metric.goal) * 100 : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'transition-shadow duration-200',
        onClick && 'cursor-pointer'
      )}
    >
      <Card className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className={cn(
            'absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300',
            metric.iconColor || 'bg-primary/10',
            isHovered ? 'opacity-100' : 'opacity-50'
          )}
          style={{ transform: 'translate(40%, -40%)' }}
        />

        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.title}
          </CardTitle>
          <div className={cn(
            'p-2 rounded-lg transition-colors',
            metric.iconColor || 'bg-primary/10'
          )}>
            <Icon className={cn(
              'w-4 h-4',
              metric.iconColor?.includes('bg-') ? 'text-current' : 'text-primary'
            )} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-baseline justify-between">
            <AnimatedNumber
              value={metric.value}
              previousValue={metric.previousValue}
              prefix={metric.prefix}
              suffix={metric.suffix}
              precision={metric.precision}
              className="text-2xl tracking-tight"
            />
            {metric.trend && (
              <TrendIndicator
                trend={metric.trend}
                value={metric.trendValue}
              />
            )}
          </div>

          {metric.description && (
            <p className="text-xs text-muted-foreground mt-2">
              {metric.description}
            </p>
          )}

          {progress !== undefined && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress to goal</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-1.5" />
            </div>
          )}

          {metric.loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Updating...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

// ============================================
// METRICS GRID COMPONENT
// ============================================

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  columns = 4,
  enableRealtime = false,
  websocketChannel,
  onMetricClick,
  className
}) => {
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const { subscribe, isConnected } = useWebSocket();

  // Update local metrics when props change
  useEffect(() => {
    setLocalMetrics(metrics);
  }, [metrics]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enableRealtime || !websocketChannel || !isConnected) return;

    const unsubscribe = subscribe(websocketChannel, (update: any) => {
      setLocalMetrics((prev) =>
        prev.map((metric) =>
          metric.id === update.id
            ? {
                ...metric,
                previousValue: metric.value,
                value: update.value,
                trend: update.trend,
                trendValue: update.trendValue,
              }
            : metric
        )
      );
    });

    return unsubscribe;
  }, [enableRealtime, websocketChannel, isConnected, subscribe]);

  const gridClassName = useMemo(() => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };
    return colsMap[columns];
  }, [columns]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Real-time indicator */}
      {enableRealtime && websocketChannel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )}
            />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live updates enabled' : 'Disconnected'}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {localMetrics.length} metrics
          </Badge>
        </div>
      )}

      {/* Metrics grid */}
      <div className={cn('grid gap-4', gridClassName)}>
        {localMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <MetricCard
              metric={metric}
              onClick={onMetricClick ? () => onMetricClick(metric) : undefined}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MetricsGrid;

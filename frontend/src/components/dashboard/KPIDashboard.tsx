// Last Modified: 2025-11-24 21:30
/**
 * KPIDashboard Component
 * Real-time KPI monitoring with live WebSocket updates
 * Features:
 * - Grid of live KPI cards with real-time values
 * - Progress rings for goal completion
 * - Sparkline charts within statistics
 * - WebSocket handlers for metric updates
 * - Configurable refresh intervals
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  Users,
  MessageSquare,
  Phone,
  LucideIcon,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// ============================================
// TYPES
// ============================================

export interface KPIMetric {
  id: string;
  title: string;
  value: number;
  unit?: string;
  prefix?: string;
  suffix?: string;
  goal?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  sparklineData?: number[];
  icon?: LucideIcon;
  color?: string;
  status?: 'good' | 'warning' | 'critical';
}

export interface KPIDashboardProps {
  metrics: KPIMetric[];
  enableRealtime?: boolean;
  websocketChannel?: string;
  refreshInterval?: number;
  columns?: 1 | 2 | 3 | 4 | 6;
  showSparklines?: boolean;
  showProgress?: boolean;
  onMetricClick?: (metric: KPIMetric) => void;
  className?: string;
}

// ============================================
// CIRCULAR PROGRESS RING
// ============================================

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

const CircularProgress = memo(function CircularProgress({
  value,
  size = 64,
  strokeWidth = 4,
  color = '#3b82f6',
  className
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-xs font-bold">
        {Math.round(value)}%
      </span>
    </div>
  );
});

// ============================================
// SPARKLINE CHART
// ============================================

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

const Sparkline = memo(function Sparkline({
  data,
  color = '#3b82f6',
  height = 32
}: SparklineProps) {
  const chartData = useMemo(() => {
    return data.map((value, index) => ({ value, index }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  metric: KPIMetric;
  showSparkline?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
}

const KPICard = memo(function KPICard({
  metric,
  showSparkline = true,
  showProgress = true,
  onClick
}: KPICardProps) {
  const Icon = metric.icon || Activity;

  const getStatusColor = () => {
    switch (metric.status) {
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-primary';
    }
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return null;
    }
  };

  const TrendIcon = getTrendIcon();

  const progressValue = metric.goal ? (metric.value / metric.goal) * 100 : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer')}
    >
      <Card className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className={cn(
            'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20',
            metric.color || 'bg-primary'
          )}
          style={{ transform: 'translate(40%, -40%)' }}
        />

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {metric.title}
              </p>
              <div className="flex items-baseline gap-1">
                <motion.span
                  key={metric.value}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('text-3xl font-bold', getStatusColor())}
                >
                  {metric.prefix}
                  {metric.value.toLocaleString()}
                  {metric.suffix}
                </motion.span>
                {metric.unit && (
                  <span className="text-sm text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Icon or Circular Progress */}
            {showProgress && progressValue !== undefined ? (
              <CircularProgress
                value={progressValue}
                color={metric.color}
              />
            ) : (
              <div className={cn(
                'p-3 rounded-lg',
                metric.color || 'bg-primary/10'
              )}>
                <Icon className={cn('w-5 h-5', getStatusColor())} />
              </div>
            )}
          </div>

          {/* Trend */}
          {TrendIcon && metric.trendPercentage !== undefined && (
            <div className="flex items-center gap-1 mb-3">
              <TrendIcon className={cn(
                'w-4 h-4',
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              )} />
              <span className={cn(
                'text-sm font-medium',
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                {metric.trendPercentage > 0 ? '+' : ''}
                {metric.trendPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                vs last period
              </span>
            </div>
          )}

          {/* Sparkline */}
          {showSparkline && metric.sparklineData && metric.sparklineData.length > 0 && (
            <div className="mb-3">
              <Sparkline
                data={metric.sparklineData}
                color={metric.color || '#3b82f6'}
              />
            </div>
          )}

          {/* Goal Progress Bar */}
          {!showProgress && metric.goal && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Goal: {metric.goal.toLocaleString()}</span>
                <span className="font-medium">
                  {progressValue?.toFixed(0)}%
                </span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>
          )}

          {/* Status Badge */}
          {metric.status && (
            <Badge
              variant={metric.status === 'good' ? 'default' : 'outline'}
              className={cn(
                'absolute top-4 left-4 text-xs',
                metric.status === 'warning' && 'border-yellow-500 text-yellow-600',
                metric.status === 'critical' && 'border-red-500 text-red-600'
              )}
            >
              {metric.status}
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

// ============================================
// KPI DASHBOARD COMPONENT
// ============================================

export const KPIDashboard: React.FC<KPIDashboardProps> = ({
  metrics,
  enableRealtime = true,
  websocketChannel = 'kpi:change',
  refreshInterval = 5000,
  columns = 4,
  showSparklines = true,
  showProgress = true,
  onMetricClick,
  className
}) => {
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const { subscribe, isConnected } = useWebSocket();

  // Update local metrics when props change
  useEffect(() => {
    setLocalMetrics(metrics);
  }, [metrics]);

  // Subscribe to real-time KPI updates
  useEffect(() => {
    if (!enableRealtime || !websocketChannel || !isConnected) return;

    const unsubscribe = subscribe(websocketChannel, (update: Partial<KPIMetric> & { id: string }) => {
      setLocalMetrics((prev) =>
        prev.map((metric) =>
          metric.id === update.id
            ? {
                ...metric,
                ...update,
                sparklineData: metric.sparklineData
                  ? [...metric.sparklineData.slice(1), update.value || metric.value]
                  : metric.sparklineData,
              }
            : metric
        )
      );
    });

    return unsubscribe;
  }, [enableRealtime, websocketChannel, isConnected, subscribe]);

  // Periodic refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      // Trigger refresh (in production, this would call an API)
      console.log('KPI Dashboard refresh');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const gridClassName = useMemo(() => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    };
    return colsMap[columns];
  }, [columns]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
          {enableRealtime && (
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                )}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          )}
        </div>
        <Badge variant="outline">
          {localMetrics.length} KPIs
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className={cn('grid gap-4', gridClassName)}>
        {localMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <KPICard
              metric={metric}
              showSparkline={showSparklines}
              showProgress={showProgress}
              onClick={onMetricClick ? () => onMetricClick(metric) : undefined}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default KPIDashboard;

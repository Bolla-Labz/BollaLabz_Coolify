// Last Modified: 2025-11-23 17:30
/**
 * RealtimeMetrics Component
 * Live data dashboard with WebSocket integration
 * Shows real-time metrics, sparklines, and status indicators
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  MessageSquare,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Line, Area } from 'recharts';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import { InteractiveButton } from '@/components/interactive/buttons/InteractiveButton';

// ============================================
// TYPES
// ============================================

export interface MetricData {
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  trend?: Array<{ time: number; value: number }>;
  status?: 'success' | 'warning' | 'error' | 'info';
  unit?: string;
  prefix?: string;
  suffix?: string;
}

export interface MetricCardProps {
  id: string;
  title: string;
  icon?: React.ElementType;
  data: MetricData;
  size?: 'sm' | 'md' | 'lg';
  sparkline?: boolean;
  animate?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface RealtimeMetricsProps {
  metrics: Array<{
    id: string;
    title: string;
    icon?: React.ElementType;
    websocketChannel?: string;
    refreshInterval?: number;
    fetchData?: () => Promise<MetricData>;
    sparkline?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }>;
  layout?: 'grid' | 'list' | 'compact';
  columns?: number | { sm: number; md: number; lg: number; xl: number };
  autoRefresh?: boolean;
  refreshInterval?: number;
  showConnectionStatus?: boolean;
  className?: string;
  onMetricClick?: (metricId: string) => void;
}

// ============================================
// SPARKLINE COMPONENT
// ============================================

const MiniSparkline: React.FC<{
  data: Array<{ time: number; value: number }>;
  color?: string;
  height?: number;
}> = ({ data, color = '#3b82f6', height = 40 }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = ((max - d.value) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${points} 100,${height} 0,${height}`}
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
};

// ============================================
// METRIC CARD COMPONENT
// ============================================

const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  icon: Icon,
  data,
  size = 'md',
  sparkline = true,
  animate = true,
  onClick,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previousValue, setPreviousValue] = useState(data.value);

  useEffect(() => {
    setPreviousValue(data.value);
  }, [data.value]);

  const formatValue = (value: number | string) => {
    if (typeof value === 'string') return value;

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

    return `${data.prefix || ''}${formatted}${data.suffix || ''}${data.unit || ''}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getChangeIcon = () => {
    if (!data.change) return null;

    if (data.changeType === 'increase' || data.change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    } else if (data.changeType === 'decrease' || data.change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
    return null;
  };

  const cardSize = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const titleSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const valueSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-lg',
        cardSize[size],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={cn('p-1.5 rounded-lg bg-opacity-10', getStatusColor(data.status))}>
              <Icon className={cn('w-4 h-4', getStatusColor(data.status))} />
            </div>
          )}
          <h3 className={cn('font-medium text-gray-600 dark:text-gray-400', titleSize[size])}>
            {title}
          </h3>
        </div>

        {/* Status indicator */}
        {data.status && (
          <div className={cn('w-2 h-2 rounded-full animate-pulse', {
            'bg-green-500': data.status === 'success',
            'bg-yellow-500': data.status === 'warning',
            'bg-red-500': data.status === 'error',
            'bg-blue-500': data.status === 'info',
          })} />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={String(data.value)}
            initial={animate ? { opacity: 0, y: -10 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn('font-bold text-gray-900 dark:text-white', valueSize[size])}
          >
            {formatValue(data.value)}
          </motion.span>
        </AnimatePresence>

        {/* Change indicator */}
        {data.change !== undefined && (
          <div className="flex items-center gap-1">
            {getChangeIcon()}
            <span className={cn('text-sm', {
              'text-green-600 dark:text-green-400': data.change > 0,
              'text-red-600 dark:text-red-400': data.change < 0,
              'text-gray-600 dark:text-gray-400': data.change === 0,
            })}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparkline && data.trend && data.trend.length > 1 && (
        <div className="mt-2">
          <MiniSparkline
            data={data.trend}
            color={data.status === 'error' ? '#ef4444' : data.status === 'warning' ? '#f59e0b' : '#3b82f6'}
            height={size === 'sm' ? 30 : size === 'lg' ? 50 : 40}
          />
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({
  metrics,
  layout = 'grid',
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  autoRefresh = true,
  refreshInterval = 5000,
  showConnectionStatus = true,
  className,
  onMetricClick,
}) => {
  const [metricsData, setMetricsData] = useState<Record<string, MetricData>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // WebSocket connection
  const { isConnected, subscribe } = useWebSocket({
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000',
  });

  // Subscribe to WebSocket channels
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    metrics.forEach(metric => {
      if (metric.websocketChannel) {
        const unsubscribe = subscribe(metric.websocketChannel, (data: MetricData) => {
          setMetricsData(prev => ({
            ...prev,
            [metric.id]: {
              ...data,
              trend: prev[metric.id]?.trend
                ? [...(prev[metric.id].trend || []).slice(-19), { time: Date.now(), value: Number(data.value) }]
                : [{ time: Date.now(), value: Number(data.value) }],
            },
          }));
          setLastUpdate(Date.now());
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [metrics, subscribe]);

  // Fetch initial data and setup refresh
  useEffect(() => {
    const fetchAllMetrics = async () => {
      setIsRefreshing(true);

      await Promise.all(
        metrics.map(async metric => {
          if (metric.fetchData) {
            try {
              const data = await metric.fetchData();
              setMetricsData(prev => ({
                ...prev,
                [metric.id]: data,
              }));
            } catch (error) {
              console.error(`Failed to fetch metric ${metric.id}:`, error);
            }
          }
        })
      );

      setIsRefreshing(false);
      setLastUpdate(Date.now());
    };

    fetchAllMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchAllMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [metrics, autoRefresh, refreshInterval]);

  // Calculate responsive columns
  const getColumns = () => {
    if (typeof columns === 'number') return columns;

    // Simplified responsive logic
    const width = window.innerWidth;
    if (width < 640) return columns.sm;
    if (width < 768) return columns.md;
    if (width < 1024) return columns.lg;
    return columns.xl;
  };

  const gridClass = useMemo(() => {
    const cols = getColumns();
    return `grid-cols-${cols}`;
  }, [columns]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    await Promise.all(
      metrics.map(async metric => {
        if (metric.fetchData) {
          try {
            const data = await metric.fetchData();
            setMetricsData(prev => ({
              ...prev,
              [metric.id]: data,
            }));
          } catch (error) {
            console.error(`Failed to refresh metric ${metric.id}:`, error);
          }
        }
      })
    );

    setIsRefreshing(false);
    setLastUpdate(Date.now());
  }, [metrics]);

  const formatLastUpdate = () => {
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {showConnectionStatus && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
              isConnected
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            )}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Disconnected</span>
                </>
              )}
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {formatLastUpdate()}
            </span>
          </div>

          <InteractiveButton
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            loading={isRefreshing}
            onClick={handleRefresh}
            tooltip="Refresh metrics"
            className={cn(isRefreshing && 'animate-spin')}
          />
        </div>
      )}

      {/* Metrics Grid/List */}
      <div className={cn(
        layout === 'grid' && 'grid gap-4',
        layout === 'grid' && gridClass,
        layout === 'list' && 'space-y-4',
        layout === 'compact' && 'flex flex-wrap gap-2'
      )}>
        {metrics.map(metric => (
          <MetricCard
            key={metric.id}
            id={metric.id}
            title={metric.title}
            icon={metric.icon}
            data={metricsData[metric.id] || {
              value: 0,
              status: 'info',
            }}
            size={metric.size || (layout === 'compact' ? 'sm' : 'md')}
            sparkline={metric.sparkline}
            onClick={() => onMetricClick?.(metric.id)}
            className={layout === 'compact' ? 'flex-1 min-w-[150px]' : ''}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// PRESET METRIC CONFIGURATIONS
// ============================================

export const PRESET_METRICS = {
  systemHealth: [
    {
      id: 'cpu',
      title: 'CPU Usage',
      icon: Activity,
      websocketChannel: 'system.cpu',
      sparkline: true,
    },
    {
      id: 'memory',
      title: 'Memory',
      icon: Database,
      websocketChannel: 'system.memory',
      sparkline: true,
    },
    {
      id: 'latency',
      title: 'Latency',
      icon: Zap,
      websocketChannel: 'system.latency',
      sparkline: true,
    },
    {
      id: 'uptime',
      title: 'Uptime',
      icon: Clock,
      websocketChannel: 'system.uptime',
    },
  ],

  business: [
    {
      id: 'revenue',
      title: 'Revenue',
      icon: DollarSign,
      websocketChannel: 'business.revenue',
      sparkline: true,
      size: 'lg' as const,
    },
    {
      id: 'users',
      title: 'Active Users',
      icon: Users,
      websocketChannel: 'business.users',
      sparkline: true,
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: MessageSquare,
      websocketChannel: 'business.messages',
      sparkline: true,
    },
    {
      id: 'calls',
      title: 'Calls',
      icon: Phone,
      websocketChannel: 'business.calls',
      sparkline: true,
    },
  ],
};

export default RealtimeMetrics;
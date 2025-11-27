// Last Modified: 2025-11-24 00:00
/**
 * DataChart Component
 * Advanced data visualization with AI insights
 * Supports multiple chart types with real-time updates
 * Optimized with React 18's useDeferredValue for smooth rendering
 */

import React, { useMemo, useCallback, useRef, useState, useEffect, useDeferredValue } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  ScatterChart,
  Scatter,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Brush,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveButton } from '@/components/interactive/buttons/InteractiveButton';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import { ChartLoadingOverlay } from '@/lib/utils/chart-optimization';

// ============================================
// TYPES
// ============================================

export interface DataChartProps {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'radar' | 'scatter' | 'heatmap' | 'sankey' | 'treemap';
  data: Array<Record<string, any>>;

  // Axes configuration
  xAxis?: {
    key: string;
    label?: string;
    type?: 'number' | 'category' | 'time';
    format?: (value: any) => string;
    angle?: number;
    interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  };

  yAxis?: {
    key: string;
    label?: string;
    format?: (value: any) => string;
    domain?: [number | 'dataMin' | 'dataMax', number | 'dataMin' | 'dataMax'];
    scale?: 'linear' | 'log' | 'pow' | 'sqrt' | 'identity';
  };

  // Series configuration
  series?: Array<{
    key: string;
    name: string;
    color?: string;
    type?: 'line' | 'bar' | 'area';
    stack?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    fillOpacity?: number;
    animationDuration?: number;
  }>;

  // Interactivity
  interactive?: {
    tooltip?: boolean;
    zoom?: boolean;
    pan?: boolean;
    brush?: boolean;
    crosshair?: boolean;
    legend?: boolean;
    export?: boolean;
    fullscreen?: boolean;
  };

  // Real-time updates
  realtime?: {
    enabled: boolean;
    interval: number;
    maxPoints: number;
    animation: boolean;
    websocketChannel?: string;
  };

  // AI features
  ai?: {
    insights?: boolean;
    predictions?: boolean;
    anomalies?: boolean;
    trends?: boolean;
  };

  // Export options
  export?: {
    png?: boolean;
    svg?: boolean;
    csv?: boolean;
    pdf?: boolean;
    json?: boolean;
  };

  // Styling
  theme?: 'light' | 'dark' | 'auto';
  height?: number | string;
  animations?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;

  // Callbacks
  onDataPointClick?: (data: any, index: number) => void;
  onBrushChange?: (startIndex: number, endIndex: number) => void;
  onExport?: (format: string, data: any) => void;
}

interface ChartInsight {
  type: 'trend' | 'anomaly' | 'prediction' | 'pattern';
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  dataPoints?: number[];
}

// ============================================
// COLOR SCHEMES
// ============================================

const COLOR_SCHEMES = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  pastel: ['#93c5fd', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd', '#fbcfe8', '#67e8f9', '#bef264'],
  vibrant: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#65a30d'],
  monochrome: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'],
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatValue = (value: any, formatter?: (v: any) => string): string => {
  if (formatter) return formatter(value);
  if (typeof value === 'number') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  }
  return String(value);
};

const generateInsights = (data: any[], series?: any[]): ChartInsight[] => {
  const insights: ChartInsight[] = [];

  if (!data.length || !series?.length) return insights;

  // Calculate trends
  series.forEach(s => {
    const values = data.map(d => d[s.key]).filter(v => typeof v === 'number');
    if (values.length > 1) {
      const lastValue = values[values.length - 1] ?? 0;
      const firstValue = values[0] ?? 0;
      const trend = lastValue > firstValue ? 'up' : 'down';
      const change = ((lastValue - firstValue) / firstValue * 100).toFixed(1);

      insights.push({
        type: 'trend',
        message: `${s.name} ${trend === 'up' ? 'increased' : 'decreased'} by ${Math.abs(Number(change))}%`,
        severity: trend === 'up' ? 'success' : 'warning',
      });
    }

    // Detect anomalies (simple outlier detection)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
    const outliers = values.map((v, i) => Math.abs(v - mean) > 2 * stdDev ? i : -1).filter(i => i >= 0);

    if (outliers.length > 0) {
      insights.push({
        type: 'anomaly',
        message: `${outliers.length} potential anomalies detected in ${s.name}`,
        severity: 'warning',
        dataPoints: outliers,
      });
    }
  });

  return insights;
};

// ============================================
// CUSTOM TOOLTIP
// ============================================

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatValue(entry.value, formatter)}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DataChart: React.FC<DataChartProps> = ({
  type,
  data,
  xAxis,
  yAxis,
  series = [],
  interactive = { tooltip: true, legend: true },
  realtime,
  ai,
  export: exportOptions,
  theme = 'auto',
  height = 400,
  animations = true,
  className,
  title,
  subtitle,
  onDataPointClick,
  onBrushChange,
  onExport,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [rawChartData, setRawChartData] = useState(data);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [insights, setInsights] = useState<ChartInsight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null);

  // Use React 18's useDeferredValue for non-blocking chart updates
  const deferredChartData = useDeferredValue(rawChartData);
  const isChartStale = rawChartData !== deferredChartData;

  // Use deferred data for rendering
  const chartData = deferredChartData;

  // WebSocket for real-time updates
  const { subscribe, isConnected } = useWebSocket({
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000',
  });

  // Update raw chart data when prop changes
  useEffect(() => {
    setRawChartData(data);
  }, [data]);

  // Real-time data updates
  useEffect(() => {
    if (realtime?.enabled && realtime.websocketChannel && isConnected) {
      const unsubscribe = subscribe(realtime.websocketChannel, (newData: any) => {
        setRawChartData(prevData => {
          const updated = [...prevData, newData];
          if (realtime.maxPoints && updated.length > realtime.maxPoints) {
            return updated.slice(-realtime.maxPoints);
          }
          return updated;
        });
      });

      return unsubscribe;
    }
  }, [realtime, isConnected, subscribe]);

  // Generate AI insights
  useEffect(() => {
    if (ai?.insights) {
      const newInsights = generateInsights(chartData, series);
      setInsights(newInsights);
    }
  }, [chartData, series, ai?.insights]);

  // Color scheme
  const colors = useMemo(() => {
    const scheme = theme === 'dark' ? COLOR_SCHEMES.vibrant : COLOR_SCHEMES.default;
    return series.map((s, i) => s.color || scheme[i % scheme.length]);
  }, [series, theme]);

  // Export functionality
  const handleExport = useCallback((format: string) => {
    if (!exportOptions?.[format as keyof typeof exportOptions]) return;

    switch (format) {
      case 'csv':
        const csv = [
          Object.keys(chartData[0]).join(','),
          ...chartData.map(row => Object.values(row).join(',')),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-data-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        break;

      case 'json':
        const json = JSON.stringify(chartData, null, 2);
        const jsonBlob = new Blob([json], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `chart-data-${Date.now()}.json`;
        jsonLink.click();
        URL.revokeObjectURL(jsonUrl);
        break;

      case 'png':
      case 'svg':
        // Would require html2canvas or similar library
        console.log(`Export as ${format} - requires additional implementation`);
        break;
    }

    onExport?.(format, chartData);
  }, [chartData, exportOptions, onExport]);

  // Render appropriate chart type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
      onClick: onDataPointClick,
    };

    const axisProps = {
      stroke: theme === 'dark' ? '#6b7280' : '#9ca3af',
      fontSize: 12,
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            {xAxis && (
              <XAxis
                dataKey={xAxis.key}
                tickFormatter={xAxis.format}
                angle={xAxis.angle}
                interval={xAxis.interval}
                {...axisProps}
              />
            )}
            {yAxis && (
              <YAxis
                tickFormatter={yAxis.format}
                domain={yAxis.domain}
                scale={yAxis.scale}
                {...axisProps}
              />
            )}
            {interactive?.tooltip && <Tooltip content={<CustomTooltip formatter={yAxis?.format} />} />}
            {interactive?.legend && <Legend />}
            {interactive?.brush && (
              <Brush
                dataKey={xAxis?.key}
                height={30}
                stroke={colors[0]}
                onChange={(domain: any) => {
                  setBrushDomain([domain.startIndex, domain.endIndex]);
                  onBrushChange?.(domain.startIndex, domain.endIndex);
                }}
              />
            )}
            {series.map((s, index) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={colors[index]}
                strokeWidth={s.strokeWidth || 2}
                strokeDasharray={s.strokeDasharray}
                dot={false}
                animationDuration={animations ? (s.animationDuration || 1000) : 0}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            {xAxis && (
              <XAxis
                dataKey={xAxis.key}
                tickFormatter={xAxis.format}
                angle={xAxis.angle}
                interval={xAxis.interval}
                {...axisProps}
              />
            )}
            {yAxis && (
              <YAxis
                tickFormatter={yAxis.format}
                domain={yAxis.domain}
                {...axisProps}
              />
            )}
            {interactive?.tooltip && <Tooltip content={<CustomTooltip formatter={yAxis?.format} />} />}
            {interactive?.legend && <Legend />}
            {series.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={colors[index]}
                stackId={s.stack}
                animationDuration={animations ? (s.animationDuration || 1000) : 0}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            {xAxis && (
              <XAxis
                dataKey={xAxis.key}
                tickFormatter={xAxis.format}
                {...axisProps}
              />
            )}
            {yAxis && (
              <YAxis
                tickFormatter={yAxis.format}
                domain={yAxis.domain}
                {...axisProps}
              />
            )}
            {interactive?.tooltip && <Tooltip content={<CustomTooltip formatter={yAxis?.format} />} />}
            {interactive?.legend && <Legend />}
            {series.map((s, index) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={colors[index]}
                fill={colors[index]}
                fillOpacity={s.fillOpacity || 0.6}
                stackId={s.stack}
                animationDuration={animations ? (s.animationDuration || 1000) : 0}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'donut':
        const pieData = series[0] ? chartData.map(d => ({
          name: d[xAxis?.key || 'name'],
          value: d[series[0].key],
        })) : [];

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={type === 'donut' ? 120 : 150}
              innerRadius={type === 'donut' ? 60 : 0}
              fill="#8884d8"
              dataKey="value"
              animationDuration={animations ? 1000 : 0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {interactive?.tooltip && <Tooltip />}
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart data={chartData}>
            <PolarGrid stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <PolarAngleAxis dataKey={xAxis?.key || 'subject'} {...axisProps} />
            <PolarRadiusAxis {...axisProps} />
            {series.map((s, index) => (
              <Radar
                key={s.key}
                name={s.name}
                dataKey={s.key}
                stroke={colors[index]}
                fill={colors[index]}
                fillOpacity={s.fillOpacity || 0.6}
              />
            ))}
            {interactive?.legend && <Legend />}
          </RadarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            {xAxis && <XAxis dataKey={xAxis.key} name={xAxis.label} {...axisProps} />}
            {yAxis && <YAxis dataKey={yAxis?.key} name={yAxis?.label} {...axisProps} />}
            {interactive?.tooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
            {series.map((s, index) => (
              <Scatter
                key={s.key}
                name={s.name}
                data={chartData}
                fill={colors[index]}
              />
            ))}
          </ScatterChart>
        );

      case 'treemap':
        return (
          <Treemap
            width={800}
            height={Number(height)}
            data={chartData}
            dataKey={series[0]?.key || 'value'}
            aspectRatio={4 / 3}
            stroke="#fff"
            fill={colors[0]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={chartRef}
      className={cn(
        'relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Export buttons */}
          {exportOptions && (
            <div className="flex items-center gap-1">
              {exportOptions.csv && (
                <InteractiveButton
                  variant="ghost"
                  size="sm"
                  icon={Download}
                  tooltip="Export as CSV"
                  onClick={() => handleExport('csv')}
                />
              )}
              {exportOptions.json && (
                <InteractiveButton
                  variant="ghost"
                  size="sm"
                  icon={Download}
                  tooltip="Export as JSON"
                  onClick={() => handleExport('json')}
                />
              )}
            </div>
          )}

          {/* Fullscreen toggle */}
          {interactive?.fullscreen && (
            <InteractiveButton
              variant="ghost"
              size="sm"
              icon={isFullscreen ? Minimize2 : Maximize2}
              tooltip={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          )}
        </div>
      </div>

      {/* AI Insights */}
      {ai?.insights && insights.length > 0 && (
        <div className="mb-4 space-y-2">
          <AnimatePresence>
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg text-sm',
                  insight.severity === 'info' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
                  insight.severity === 'success' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
                  insight.severity === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
                  insight.severity === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                )}
                onClick={() => setSelectedInsight(selectedInsight === index ? null : index)}
              >
                {insight.type === 'trend' && (
                  insight.message.includes('increased') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                )}
                {insight.type === 'anomaly' && <AlertCircle className="w-4 h-4" />}
                <span>{insight.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Chart */}
      <div className={cn('w-full relative', isFullscreen && 'h-full')}>
        <div className={cn('transition-opacity duration-200', isChartStale && 'opacity-70')}>
          <ResponsiveContainer width="100%" height={isFullscreen ? '100%' : height}>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Loading overlay during data processing */}
        <ChartLoadingOverlay isVisible={isChartStale} />
      </div>

      {/* Real-time indicator */}
      {realtime?.enabled && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-700 dark:text-green-400">Live</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataChart;
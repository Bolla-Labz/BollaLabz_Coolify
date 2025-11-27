// Last Modified: 2025-11-24 21:35
/**
 * CustomTooltip Component Library
 * Rich, interactive tooltips for data visualization
 * Features:
 * - Multi-value comparisons
 * - Historical context (vs last period)
 * - Click to pin/unpin functionality
 * - Mobile-optimized touch support
 * - Statistic-style formatting
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Pin,
  PinOff,
  X,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface TooltipDataPoint {
  name: string;
  value: number;
  color?: string;
  prefix?: string;
  suffix?: string;
  previousValue?: number;
  unit?: string;
  goal?: number;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  data?: TooltipDataPoint[];
  showComparison?: boolean;
  showProgress?: boolean;
  pinnable?: boolean;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  onPin?: (isPinned: boolean) => void;
  className?: string;
}

// ============================================
// TREND INDICATOR
// ============================================

interface TrendProps {
  current: number;
  previous?: number;
  precision?: number;
}

const TrendIndicator: React.FC<TrendProps> = ({ current, previous, precision = 1 }) => {
  if (previous === undefined || previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.1;

  if (isNeutral) return null;

  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
      isPositive
        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    )}>
      <Icon className="w-3 h-3" />
      <span>{Math.abs(change).toFixed(precision)}%</span>
    </div>
  );
};

// ============================================
// DATA ROW COMPONENT
// ============================================

interface DataRowProps {
  dataPoint: TooltipDataPoint;
  showComparison?: boolean;
  showProgress?: boolean;
  formatter?: (value: number) => string;
}

const DataRow: React.FC<DataRowProps> = ({
  dataPoint,
  showComparison = false,
  showProgress = false,
  formatter
}) => {
  const formatValue = (value: number) => {
    if (formatter) return formatter(value);
    return `${dataPoint.prefix || ''}${value.toLocaleString()}${dataPoint.suffix || ''}`;
  };

  const progress = dataPoint.goal ? (dataPoint.value / dataPoint.goal) * 100 : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {dataPoint.color && (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: dataPoint.color }}
            />
          )}
          <span className="text-sm text-muted-foreground truncate">
            {dataPoint.name}:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold">
            {formatValue(dataPoint.value)}
          </span>
          {dataPoint.unit && (
            <span className="text-xs text-muted-foreground">
              {dataPoint.unit}
            </span>
          )}
        </div>
      </div>

      {/* Comparison with previous value */}
      {showComparison && dataPoint.previousValue !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Previous: {formatValue(dataPoint.previousValue)}
          </span>
          <TrendIndicator
            current={dataPoint.value}
            previous={dataPoint.previousValue}
          />
        </div>
      )}

      {/* Progress to goal */}
      {showProgress && progress !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Goal: {formatValue(dataPoint.goal!)}
            </span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-1" />
        </div>
      )}
    </div>
  );
};

// ============================================
// CUSTOM TOOLTIP COMPONENT
// ============================================

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active = false,
  payload = [],
  label,
  data,
  showComparison = false,
  showProgress = false,
  pinnable = false,
  formatter,
  labelFormatter,
  onPin,
  className
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Convert payload to data points if data not provided
  const dataPoints: TooltipDataPoint[] = data || payload.map((entry: any) => ({
    name: entry.name || entry.dataKey,
    value: entry.value,
    color: entry.color,
    previousValue: entry.payload?.previousValue,
    unit: entry.unit,
  }));

  // Handle pin toggle
  const handlePinToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    onPin?.(newPinnedState);
  }, [isPinned, onPin]);

  // Handle close
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned(false);
    onPin?.(false);
  }, [onPin]);

  // Close on escape key
  useEffect(() => {
    if (!isPinned) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPinned(false);
        onPin?.(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPinned, onPin]);

  // Don't render if not active and not pinned
  if (!active && !isPinned) return null;

  // Format label
  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label;

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'bg-background/95 backdrop-blur-md border rounded-lg shadow-lg p-4 max-w-sm',
          isPinned && 'ring-2 ring-primary',
          className
        )}
        style={{
          pointerEvents: isPinned ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <div className="flex-1">
            {formattedLabel && (
              <p className="text-sm font-semibold">{formattedLabel}</p>
            )}
          </div>

          {/* Pin/Close buttons */}
          <div className="flex items-center gap-1">
            {pinnable && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePinToggle}
                className="p-1 hover:bg-muted rounded"
                title={isPinned ? 'Unpin tooltip' : 'Pin tooltip'}
              >
                {isPinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </motion.button>
            )}

            {isPinned && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-1 hover:bg-muted rounded"
                title="Close tooltip"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Data points */}
        <div className="space-y-3">
          {dataPoints.map((point, index) => (
            <DataRow
              key={index}
              dataPoint={point}
              showComparison={showComparison}
              showProgress={showProgress}
              formatter={formatter}
            />
          ))}
        </div>

        {/* Pin hint */}
        {pinnable && !isPinned && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Click to pin this tooltip
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// SIMPLE TOOLTIP (for basic use cases)
// ============================================

export interface SimpleTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number) => string;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  active,
  payload,
  label,
  formatter
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border"
    >
      {label && (
        <p className="text-sm font-medium mb-2">{label}</p>
      )}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

export default CustomTooltip;

// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Progress Component
 * Wraps Ant Design Progress with TailwindCSS className support
 */

import React from 'react';
import { Progress, type ProgressProps } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import { cn } from '@/lib/utils';

export interface AntProgressProps extends ProgressProps {
  /**
   * TailwindCSS className for additional styling
   */
  className?: string;

  /**
   * Progress percentage (0-100)
   */
  percent: number;

  /**
   * Progress type
   * @default 'line'
   */
  type?: 'line' | 'circle' | 'dashboard';

  /**
   * Progress status
   * @default 'normal'
   */
  status?: 'success' | 'exception' | 'normal' | 'active';

  /**
   * Show percentage text
   * @default true
   */
  showInfo?: boolean;

  /**
   * Progress bar stroke color
   */
  strokeColor?: string;

  /**
   * Progress bar width (for circle/dashboard)
   */
  strokeWidth?: number;

  /**
   * Circle/dashboard size
   * @default 120
   */
  size?: number | [number, number];

  /**
   * Custom format for percentage text
   */
  format?: (percent?: number) => React.ReactNode;
}

/**
 * Progress Component
 *
 * Visual indicator for task completion, loading states, and goal tracking.
 * Aligns with "Proactive Intelligence" by showing progress toward goals.
 *
 * @example
 * ```tsx
 * // Line progress
 * <AntProgress
 *   percent={75}
 *   status="active"
 *   className="mb-4"
 * />
 *
 * // Circle progress
 * <AntProgress
 *   type="circle"
 *   percent={90}
 *   format={(percent) => `${percent}% Done`}
 * />
 * ```
 */
export const AntProgress: React.FC<AntProgressProps> = ({
  className,
  type = 'line',
  showInfo = true,
  ...props
}) => {
  return (
    <ConfigProvider theme={bollaLabzTheme}>
      <Progress
        {...props}
        type={type}
        showInfo={showInfo}
        className={cn(
          // Align with design system
          'bolla-progress',
          className
        )}
      />
    </ConfigProvider>
  );
};

export default AntProgress;

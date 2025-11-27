// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Statistic Component
 * Wraps Ant Design Statistic with TailwindCSS className support
 */

import React from 'react';
import { Statistic, type StatisticProps } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import { cn } from '@/lib/utils';

export interface AntStatisticProps extends StatisticProps {
  /**
   * TailwindCSS className for additional styling
   */
  className?: string;

  /**
   * Statistic title
   */
  title?: React.ReactNode;

  /**
   * Statistic value
   */
  value?: string | number;

  /**
   * Precision for decimal numbers
   */
  precision?: number;

  /**
   * Custom value formatter
   */
  formatter?: (value: string | number | undefined) => React.ReactNode;

  /**
   * Prefix content (e.g., currency symbol)
   */
  prefix?: React.ReactNode;

  /**
   * Suffix content (e.g., units)
   */
  suffix?: React.ReactNode;

  /**
   * Icon to display
   */
  valueIcon?: React.ReactNode;

  /**
   * Value style
   */
  valueStyle?: React.CSSProperties;

  /**
   * Loading state
   */
  loading?: boolean;
}

/**
 * Statistic Component
 *
 * Displays numerical data with context and formatting.
 * Perfect for dashboards showing metrics, KPIs, and analytics.
 *
 * @example
 * ```tsx
 * // Basic statistic
 * <AntStatistic
 *   title="Total Contacts"
 *   value={1128}
 *   className="mb-4"
 * />
 *
 * // Currency statistic
 * <AntStatistic
 *   title="Monthly Budget"
 *   value={2450.50}
 *   precision={2}
 *   prefix="$"
 * />
 *
 * // Percentage with custom style
 * <AntStatistic
 *   title="Success Rate"
 *   value={95.8}
 *   precision={1}
 *   suffix="%"
 *   valueStyle={{ color: '#22c55e' }}
 * />
 * ```
 */
export const AntStatistic: React.FC<AntStatisticProps> = ({
  className,
  ...props
}) => {
  return (
    <ConfigProvider theme={bollaLabzTheme}>
      <Statistic
        {...props}
        className={cn(
          // Align with design system
          'bolla-statistic',
          className
        )}
      />
    </ConfigProvider>
  );
};

export default AntStatistic;

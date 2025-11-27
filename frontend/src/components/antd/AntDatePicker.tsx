// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Date Picker Component
 * Wraps Ant Design DatePicker with TailwindCSS className support
 */

import React from 'react';
import { DatePicker, type DatePickerProps } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import { cn } from '@/lib/utils';
import type { Dayjs } from 'dayjs';

export interface AntDatePickerProps extends Omit<DatePickerProps, 'value' | 'onChange'> {
  /**
   * TailwindCSS className for additional styling
   */
  className?: string;

  /**
   * Current date value (Dayjs object)
   */
  value?: Dayjs | null;

  /**
   * Change handler
   */
  onChange?: (date: Dayjs | null, dateString: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Format string for display
   * @default 'MM/DD/YYYY'
   */
  format?: string;

  /**
   * Show time picker
   */
  showTime?: boolean | object;

  /**
   * Allow clearing selection
   * @default true
   */
  allowClear?: boolean;
}

/**
 * Date Picker Component
 *
 * Integrates Ant Design's powerful date picker with BollaLabz design system.
 * Supports TailwindCSS classes for seamless integration with existing components.
 *
 * @example
 * ```tsx
 * <AntDatePicker
 *   value={selectedDate}
 *   onChange={(date) => setSelectedDate(date)}
 *   className="w-full"
 *   placeholder="Select appointment date"
 * />
 * ```
 */
export const AntDatePicker: React.FC<AntDatePickerProps> = ({
  className,
  format = 'MM/DD/YYYY',
  allowClear = true,
  ...props
}) => {
  return (
    <ConfigProvider theme={bollaLabzTheme}>
      <DatePicker
        {...props}
        format={format}
        allowClear={allowClear}
        className={cn(
          // Base styles aligned with existing input components
          'w-full rounded-lg border border-input bg-background',
          'hover:border-ring focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    </ConfigProvider>
  );
};

export default AntDatePicker;

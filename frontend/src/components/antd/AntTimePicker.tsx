// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Time Picker Component
 * Wraps Ant Design TimePicker with TailwindCSS className support
 */

import React from 'react';
import { TimePicker, type TimePickerProps } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import { cn } from '@/lib/utils';
import type { Dayjs } from 'dayjs';

export interface AntTimePickerProps extends Omit<TimePickerProps, 'value' | 'onChange'> {
  /**
   * TailwindCSS className for additional styling
   */
  className?: string;

  /**
   * Current time value (Dayjs object)
   */
  value?: Dayjs | null;

  /**
   * Change handler
   */
  onChange?: (time: Dayjs | null, timeString: string) => void;

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
   * @default 'HH:mm'
   */
  format?: string;

  /**
   * Use 12-hour format
   * @default false
   */
  use12Hours?: boolean;

  /**
   * Allow clearing selection
   * @default true
   */
  allowClear?: boolean;
}

/**
 * Time Picker Component
 *
 * Integrates Ant Design's time picker with BollaLabz design system.
 * Perfect for scheduling tasks, meetings, and reminders.
 *
 * @example
 * ```tsx
 * <AntTimePicker
 *   value={reminderTime}
 *   onChange={(time) => setReminderTime(time)}
 *   className="w-48"
 *   use12Hours
 *   format="h:mm A"
 * />
 * ```
 */
export const AntTimePicker: React.FC<AntTimePickerProps> = ({
  className,
  format = 'HH:mm',
  allowClear = true,
  ...props
}) => {
  return (
    <ConfigProvider theme={bollaLabzTheme}>
      <TimePicker
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

export default AntTimePicker;

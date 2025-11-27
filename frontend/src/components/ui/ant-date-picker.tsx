// Last Modified: 2025-11-24 16:15
/**
 * Ant Design DatePicker wrapper component
 * Integrates Ant Design's powerful date picker with our application theme
 * Supports dark mode, custom styling, and timezone awareness
 */
import React from 'react';
import { DatePicker as AntDatePickerComponent, DatePickerProps as AntDatePickerProps } from 'antd';
import { ConfigProvider, theme } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export interface DatePickerProps extends Omit<AntDatePickerProps, 'value' | 'onChange'> {
  value?: Date | string | Dayjs | null;
  onChange?: (date: Date | null, dateString: string) => void;
  timezone?: string;
  className?: string;
}

export function AntDatePicker({
  value,
  onChange,
  timezone: tz,
  className,
  ...props
}: DatePickerProps) {
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark';

  // Convert value to dayjs format with timezone support
  const getDayjsValue = (): Dayjs | null => {
    if (!value) return null;

    let dayjsValue: Dayjs;
    if (value instanceof Date) {
      dayjsValue = dayjs(value);
    } else if (typeof value === 'string') {
      dayjsValue = dayjs(value);
    } else {
      dayjsValue = value as Dayjs;
    }

    // Apply timezone if provided
    if (tz) {
      return dayjsValue.tz(tz);
    }

    return dayjsValue;
  };

  // Handle onChange with timezone conversion
  const handleChange = (date: Dayjs | null, dateString: string | string[]) => {
    if (!onChange) return;

    if (!date) {
      onChange(null, '');
      return;
    }

    // Convert back to Date object, respecting timezone
    const jsDate = tz ? date.tz(tz).toDate() : date.toDate();
    onChange(jsDate, Array.isArray(dateString) ? dateString[0] : dateString);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: 'hsl(222.2 47.4% 11.2%)',
          colorBgContainer: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
          colorBorder: isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(214.3 31.8% 91.4%)',
          borderRadius: 6,
        },
      }}
    >
      <AntDatePickerComponent
        value={getDayjsValue()}
        onChange={handleChange}
        className={cn('w-full', className)}
        {...props}
      />
    </ConfigProvider>
  );
}

export default AntDatePicker;

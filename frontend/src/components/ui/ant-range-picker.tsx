// Last Modified: 2025-11-24 16:15
/**
 * Ant Design RangePicker wrapper component
 * Enables selection of date/time ranges for multi-day events
 * Supports timezone conversion and dark mode
 */
import React from 'react';
import { DatePicker, ConfigProvider, theme } from 'antd';
import { RangePickerProps as AntRangePickerProps } from 'antd/es/date-picker';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const { RangePicker: AntRangePickerComponent } = DatePicker;

dayjs.extend(utc);
dayjs.extend(timezone);

export interface RangePickerProps extends Omit<AntRangePickerProps, 'value' | 'onChange'> {
  value?: [Date | string | Dayjs | null, Date | string | Dayjs | null] | null;
  onChange?: (dates: [Date | null, Date | null] | null, dateStrings: [string, string]) => void;
  timezone?: string;
  className?: string;
  showTime?: boolean;
}

export function AntRangePicker({
  value,
  onChange,
  timezone: tz,
  className,
  showTime = false,
  ...props
}: RangePickerProps) {
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark';

  const getDayjsValue = (): [Dayjs, Dayjs] | null => {
    if (!value || !value[0] || !value[1]) return null;

    const convertToDayjs = (date: Date | string | Dayjs | null): Dayjs | null => {
      if (!date) return null;

      let dayjsValue: Dayjs;
      if (date instanceof Date) {
        dayjsValue = dayjs(date);
      } else if (typeof date === 'string') {
        dayjsValue = dayjs(date);
      } else {
        dayjsValue = date as Dayjs;
      }

      if (tz) {
        return dayjsValue.tz(tz);
      }

      return dayjsValue;
    };

    const start = convertToDayjs(value[0]);
    const end = convertToDayjs(value[1]);

    if (!start || !end) return null;
    return [start, end];
  };

  const handleChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    if (!onChange) return;

    if (!dates || !dates[0] || !dates[1]) {
      onChange(null, ['', '']);
      return;
    }

    const [start, end] = dates;
    const startDate = tz ? start.tz(tz).toDate() : start.toDate();
    const endDate = tz ? end.tz(tz).toDate() : end.toDate();

    onChange([startDate, endDate], dateStrings);
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
      <AntRangePickerComponent
        value={getDayjsValue()}
        onChange={handleChange}
        showTime={showTime}
        className={cn('w-full', className)}
        {...props}
      />
    </ConfigProvider>
  );
}

export default AntRangePicker;

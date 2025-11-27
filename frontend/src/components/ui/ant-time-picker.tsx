// Last Modified: 2025-11-24 16:15
/**
 * Ant Design TimePicker wrapper component
 * Provides precise time selection with timezone support
 * Integrates with application theme system
 */
import React from 'react';
import { TimePicker as AntTimePickerComponent, TimePickerProps as AntTimePickerProps } from 'antd';
import { ConfigProvider, theme } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface TimePickerProps extends Omit<AntTimePickerProps, 'value' | 'onChange'> {
  value?: Date | string | Dayjs | null;
  onChange?: (date: Date | null, timeString: string) => void;
  timezone?: string;
  className?: string;
  use12Hours?: boolean;
}

export function AntTimePicker({
  value,
  onChange,
  timezone: tz,
  className,
  use12Hours = true,
  format = use12Hours ? 'h:mm A' : 'HH:mm',
  ...props
}: TimePickerProps) {
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark';

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

    if (tz) {
      return dayjsValue.tz(tz);
    }

    return dayjsValue;
  };

  const handleChange = (time: Dayjs | null, timeString: string | string[]) => {
    if (!onChange) return;

    if (!time) {
      onChange(null, '');
      return;
    }

    const jsDate = tz ? time.tz(tz).toDate() : time.toDate();
    onChange(jsDate, Array.isArray(timeString) ? timeString[0] : timeString);
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
      <AntTimePickerComponent
        value={getDayjsValue()}
        onChange={handleChange}
        use12Hours={use12Hours}
        format={format}
        className={cn('w-full', className)}
        {...props}
      />
    </ConfigProvider>
  );
}

export default AntTimePicker;

// Last Modified: 2025-11-24 16:15
/**
 * Ant Design Tree-Shaking Imports
 * ONLY imports the 8 components we actually use
 * Prevents bundling the entire 200+ component library
 *
 * IMPORTANT: Always import from 'antd/es/component-name' for maximum tree-shaking
 */

// Component exports with explicit ES module imports
export { DatePicker } from 'antd/es/date-picker';
export type { DatePickerProps } from 'antd/es/date-picker';

export { TimePicker } from 'antd/es/time-picker';
export type { TimePickerProps } from 'antd/es/time-picker';

// Notification is a global API, import differently
export { notification } from 'antd/es';
export type { NotificationInstance } from 'antd/es/notification/interface';

export { Drawer } from 'antd/es/drawer';
export type { DrawerProps } from 'antd/es/drawer';

export { Dropdown } from 'antd/es/dropdown';
export type { DropdownProps } from 'antd/es/dropdown';

export { Steps } from 'antd/es/steps';
export type { StepsProps, StepProps } from 'antd/es/steps';

export { Progress } from 'antd/es/progress';
export type { ProgressProps } from 'antd/es/progress';

export { Statistic } from 'antd/es/statistic';
export type { StatisticProps } from 'antd/es/statistic';

// Theme configuration exports
export { ConfigProvider } from 'antd/es/config-provider';
export type { ConfigProviderProps } from 'antd/es/config-provider';

// Theme exports
export { theme } from 'antd/es';

/**
 * Bundle Size Target: 35KB gzipped total
 *
 * Component estimates (gzipped):
 * - DatePicker: ~8KB (includes calendar logic)
 * - TimePicker: ~5KB (simpler than DatePicker)
 * - Notification: ~3KB (toast-like API)
 * - Drawer: ~4KB (side panel)
 * - Dropdown: ~3KB (menu overlay)
 * - Steps: ~3KB (progress indicator)
 * - Progress: ~2KB (progress bar)
 * - Statistic: ~2KB (number display)
 * - ConfigProvider: ~5KB (theme provider)
 *
 * Total Estimate: ~35KB gzipped
 */

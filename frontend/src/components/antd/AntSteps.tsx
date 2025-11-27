// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Steps Component
 * Wraps Ant Design Steps with TailwindCSS className support
 */

import React from 'react';
import { Steps, type StepsProps, type StepProps } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import { cn } from '@/lib/utils';

export interface AntStepsProps extends StepsProps {
  /**
   * TailwindCSS className for additional styling
   */
  className?: string;

  /**
   * Current active step (0-indexed)
   */
  current?: number;

  /**
   * Step items configuration
   */
  items: StepProps[];

  /**
   * Layout direction
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';

  /**
   * Step size
   * @default 'default'
   */
  size?: 'default' | 'small';

  /**
   * Current status
   * @default 'process'
   */
  status?: 'wait' | 'process' | 'finish' | 'error';

  /**
   * Show progress dot instead of icon
   */
  progressDot?: boolean;

  /**
   * Change handler
   */
  onChange?: (current: number) => void;
}

/**
 * Steps Component
 *
 * Visualizes multi-step workflows and processes.
 * Perfect for onboarding, task completion, and workflow tracking.
 *
 * @example
 * ```tsx
 * <AntSteps
 *   current={currentStep}
 *   items={[
 *     { title: 'Contact Info', description: 'Enter basic details' },
 *     { title: 'Preferences', description: 'Set communication preferences' },
 *     { title: 'Complete', description: 'Review and save' },
 *   ]}
 *   onChange={(step) => setCurrentStep(step)}
 * />
 * ```
 */
export const AntSteps: React.FC<AntStepsProps> = ({
  className,
  direction = 'horizontal',
  size = 'default',
  status = 'process',
  ...props
}) => {
  return (
    <ConfigProvider theme={bollaLabzTheme}>
      <Steps
        {...props}
        direction={direction}
        size={size}
        status={status}
        className={cn(
          // Align with design system spacing
          'bolla-steps',
          className
        )}
      />
    </ConfigProvider>
  );
};

export default AntSteps;

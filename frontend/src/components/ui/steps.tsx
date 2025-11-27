// Last Modified: 2025-11-24 21:15
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface StepsProps {
  current: number;
  items: StepItem[];
  onChange?: (step: number) => void;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  size?: 'default' | 'small';
  status?: 'wait' | 'process' | 'finish' | 'error';
}

/**
 * Steps Component - Visual progress indicator for multi-step workflows
 * Implements Ant Design Steps pattern using Radix UI primitives
 */
export function Steps({
  current,
  items,
  onChange,
  className,
  direction = 'horizontal',
  size = 'default',
  status = 'process',
}: StepsProps) {
  const getStepStatus = (index: number) => {
    if (index < current) return 'finish';
    if (index === current) return status;
    return 'wait';
  };

  const isClickable = (index: number) => onChange && index < current;

  const renderStepIcon = (item: StepItem, index: number, stepStatus: string) => {
    if (stepStatus === 'finish') {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-5 w-5" />
        </div>
      );
    }

    if (stepStatus === 'error') {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
          <span className="text-sm font-semibold">!</span>
        </div>
      );
    }

    if (item.icon) {
      return (
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2',
            stepStatus === 'process'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground bg-background text-muted-foreground'
          )}
        >
          {item.icon}
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border-2',
          stepStatus === 'process'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground bg-background text-muted-foreground'
        )}
      >
        <span className="text-sm font-semibold">{index + 1}</span>
      </div>
    );
  };

  const renderHorizontalSteps = () => (
    <div className={cn('flex items-center justify-between', className)}>
      {items.map((item, index) => {
        const stepStatus = getStepStatus(index);
        const clickable = isClickable(index);

        return (
          <React.Fragment key={index}>
            <div
              className={cn(
                'flex flex-col items-center gap-2',
                size === 'small' ? 'min-w-[80px]' : 'min-w-[120px]',
                clickable && 'cursor-pointer hover:opacity-80'
              )}
              onClick={() => clickable && onChange?.(index)}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onChange?.(index);
                }
              }}
              aria-current={index === current ? 'step' : undefined}
              aria-disabled={!clickable}
            >
              {renderStepIcon(item, index, stepStatus)}
              <div className="text-center">
                <div
                  className={cn(
                    'text-sm font-medium',
                    stepStatus === 'process' && 'text-foreground',
                    stepStatus === 'finish' && 'text-foreground',
                    stepStatus === 'wait' && 'text-muted-foreground',
                    stepStatus === 'error' && 'text-destructive'
                  )}
                >
                  {item.title}
                </div>
                {item.description && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < items.length - 1 && (
              <div
                className={cn(
                  'h-[2px] flex-1',
                  stepStatus === 'finish'
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderVerticalSteps = () => (
    <div className={cn('flex flex-col gap-4', className)}>
      {items.map((item, index) => {
        const stepStatus = getStepStatus(index);
        const clickable = isClickable(index);

        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(clickable && 'cursor-pointer hover:opacity-80')}
                onClick={() => clickable && onChange?.(index)}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onChange?.(index);
                  }
                }}
                aria-current={index === current ? 'step' : undefined}
                aria-disabled={!clickable}
              >
                {renderStepIcon(item, index, stepStatus)}
              </div>
              {index < items.length - 1 && (
                <div
                  className={cn(
                    'w-[2px] flex-1 my-2',
                    stepStatus === 'finish'
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  )}
                  style={{ minHeight: '40px' }}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div
                className={cn(
                  'text-sm font-medium',
                  stepStatus === 'process' && 'text-foreground',
                  stepStatus === 'finish' && 'text-foreground',
                  stepStatus === 'wait' && 'text-muted-foreground',
                  stepStatus === 'error' && 'text-destructive'
                )}
              >
                {item.title}
              </div>
              {item.description && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return direction === 'horizontal'
    ? renderHorizontalSteps()
    : renderVerticalSteps();
}

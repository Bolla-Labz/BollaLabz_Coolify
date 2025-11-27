// Last Modified: 2025-11-24 21:18
import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldStatus {
  name: string;
  label: string;
  required: boolean;
  completed: boolean;
  hasError?: boolean;
}

export interface FormProgressTrackerProps {
  fields: FieldStatus[];
  currentStep?: number;
  totalSteps?: number;
  estimatedTimeMinutes?: number;
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  onFieldClick?: (fieldName: string) => void;
}

/**
 * FormProgressTracker - Floating progress indicator for forms
 *
 * Features:
 * - Field completion percentage
 * - Required vs optional field counts
 * - Time estimate for completion
 * - One-click navigation to incomplete fields
 * - Collapsible/expandable
 * - Mobile-optimized positioning
 */
export function FormProgressTracker({
  fields,
  currentStep,
  totalSteps,
  estimatedTimeMinutes,
  className,
  collapsed = false,
  onToggle,
  onFieldClick,
}: FormProgressTrackerProps) {
  const stats = useMemo(() => {
    const total = fields.length;
    const completed = fields.filter((f) => f.completed).length;
    const required = fields.filter((f) => f.required).length;
    const requiredCompleted = fields.filter((f) => f.required && f.completed).length;
    const optional = total - required;
    const optionalCompleted = completed - requiredCompleted;
    const withErrors = fields.filter((f) => f.hasError).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Estimate remaining time based on incomplete required fields
    const remainingRequired = required - requiredCompleted;
    const avgTimePerField = estimatedTimeMinutes
      ? estimatedTimeMinutes / total
      : 0.5;
    const estimatedRemaining = Math.ceil(remainingRequired * avgTimePerField);

    return {
      total,
      completed,
      required,
      requiredCompleted,
      optional,
      optionalCompleted,
      withErrors,
      percentage,
      estimatedRemaining,
      allRequiredComplete: requiredCompleted === required,
    };
  }, [fields, estimatedTimeMinutes]);

  const incompleteFields = useMemo(
    () => fields.filter((f) => !f.completed),
    [fields]
  );

  if (collapsed) {
    return (
      <div
        className={cn(
          'fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-2',
          className
        )}
      >
        <Card
          className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3 p-3">
            <div className="relative">
              <Progress value={stats.percentage} className="h-2 w-20" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {stats.percentage}%
              </span>
            </div>
            <div className="text-xs">
              <div className="font-medium">
                {stats.completed}/{stats.total} fields
              </div>
              {!stats.allRequiredComplete && (
                <div className="text-muted-foreground text-[10px]">
                  {stats.required - stats.requiredCompleted} required
                </div>
              )}
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-40 w-80 max-h-[500px] animate-in slide-in-from-bottom-2',
        'md:w-96',
        className
      )}
    >
      <Card className="shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="font-semibold text-sm">Form Progress</h3>
            {currentStep !== undefined && totalSteps !== undefined && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Step {currentStep + 1} of {totalSteps}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-label="Collapse progress tracker"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{stats.percentage}% Complete</span>
            {stats.estimatedRemaining > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                ~{stats.estimatedRemaining} min left
              </div>
            )}
          </div>
          <Progress value={stats.percentage} className="h-2" />

          {/* Stats */}
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {stats.requiredCompleted}/{stats.required} required
            </Badge>
            {stats.optional > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Circle className="h-3 w-3 mr-1" />
                {stats.optionalCompleted}/{stats.optional} optional
              </Badge>
            )}
            {stats.withErrors > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {stats.withErrors} errors
              </Badge>
            )}
          </div>
        </div>

        {/* Field List */}
        {incompleteFields.length > 0 ? (
          <div className="max-h-60 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Incomplete Fields ({incompleteFields.length})
              </h4>
              <div className="space-y-1">
                {incompleteFields.map((field) => (
                  <button
                    key={field.name}
                    onClick={() => onFieldClick?.(field.name)}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-md text-sm text-left transition-colors',
                      'hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
                      field.hasError && 'bg-destructive/10 hover:bg-destructive/20'
                    )}
                  >
                    {field.hasError ? (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="flex-1">{field.label}</span>
                    {field.required && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        Required
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-sm">All fields complete!</p>
            <p className="text-xs text-muted-foreground mt-1">
              You can submit the form now
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Hook to track form field completion status
 */
export function useFormProgress(
  formData: any,
  requiredFields: string[],
  optionalFields: string[] = [],
  fieldLabels: Record<string, string> = {},
  errors: Record<string, any> = {}
): FieldStatus[] {
  return useMemo(() => {
    const allFields = [...requiredFields, ...optionalFields];

    return allFields.map((fieldName) => ({
      name: fieldName,
      label: fieldLabels[fieldName] || fieldName,
      required: requiredFields.includes(fieldName),
      completed: !!formData[fieldName] && formData[fieldName] !== '',
      hasError: !!errors[fieldName],
    }));
  }, [formData, requiredFields, optionalFields, fieldLabels, errors]);
}

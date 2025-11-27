// Last Modified: 2025-11-24 21:17
import React, { useState, useEffect, useCallback } from 'react';
import { Steps, StepItem } from '@/components/ui/steps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AutoSaveProvider, useAutoSave } from './AutoSaveProvider';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export interface MultiStepFormStep {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  validate?: (data: any) => Promise<boolean | string>;
  optional?: boolean;
}

export interface MultiStepFormProps {
  steps: MultiStepFormStep[];
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  storageKey: string;
  resumeOnMount?: boolean;
  showProgress?: boolean;
  allowSkipOptional?: boolean;
  className?: string;
}

/**
 * MultiStepForm - Base component for multi-step form workflows
 *
 * Features:
 * - Visual step progress indicator
 * - Step-level validation
 * - Auto-save with resume capability
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Optional step skipping
 * - Mobile-friendly
 * - Accessibility WCAG 2.1 AA compliant
 */
export function MultiStepForm({
  steps,
  onSubmit,
  onCancel,
  initialData,
  storageKey,
  resumeOnMount = true,
  showProgress = true,
  allowSkipOptional = true,
  className,
}: MultiStepFormProps) {
  return (
    <AutoSaveProvider storageKey={storageKey} enabled={true}>
      <MultiStepFormContent
        steps={steps}
        onSubmit={onSubmit}
        onCancel={onCancel}
        initialData={initialData}
        resumeOnMount={resumeOnMount}
        showProgress={showProgress}
        allowSkipOptional={allowSkipOptional}
        className={className}
      />
    </AutoSaveProvider>
  );
}

function MultiStepFormContent({
  steps,
  onSubmit,
  onCancel,
  initialData,
  resumeOnMount,
  showProgress,
  allowSkipOptional,
  className,
}: Omit<MultiStepFormProps, 'storageKey'>) {
  const { save, restore, clearSaved, hasUnsavedChanges } = useAutoSave();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(initialData || {});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resume from saved state on mount
  useEffect(() => {
    if (resumeOnMount) {
      const saved = restore();
      if (saved) {
        setFormData(saved.formData || {});
        setCurrentStep(saved.currentStep || 0);
        toast.success('Resumed from saved progress', {
          duration: 2000,
        });
      }
    }
  }, [resumeOnMount, restore]);

  // Auto-save form data on changes
  useEffect(() => {
    save({ formData, currentStep });
  }, [formData, currentStep, save]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handlePrevious();
      } else if (e.key === 'Enter' && currentStep === steps.length - 1) {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, formData]);

  const handleStepChange = useCallback((step: number) => {
    // Only allow going back to previous steps
    if (step < currentStep) {
      setCurrentStep(step);
      setValidationError(null);
    }
  }, [currentStep]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const step = steps[currentStep];

    if (!step.validate) {
      return true;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await step.validate(formData);

      if (typeof result === 'string') {
        setValidationError(result);
        return false;
      }

      return result;
    } catch (error: any) {
      setValidationError(error.message || 'Validation failed');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error(validationError || 'Please fix the errors before continuing');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setValidationError(null);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationError(null);
    }
  };

  const handleSkip = () => {
    const step = steps[currentStep];
    if (step.optional && allowSkipOptional && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setValidationError(null);
    }
  };

  const handleSubmit = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error(validationError || 'Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      clearSaved();
      toast.success('Form submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }

    clearSaved();
    onCancel?.();
  };

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Convert steps to StepItem format
  const stepItems: StepItem[] = steps.map((step) => ({
    title: step.title,
    description: step.description,
    icon: step.icon,
  }));

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Progress Steps */}
      {showProgress && (
        <div className="mb-8">
          <Steps
            current={currentStep}
            items={stepItems}
            onChange={handleStepChange}
          />
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6 min-h-[400px]">
          <div
            role="region"
            aria-live="polite"
            aria-label={`Step ${currentStep + 1} of ${steps.length}: ${currentStepData.title}`}
          >
            {/* Step Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              {currentStepData.description && (
                <p className="text-muted-foreground mt-2">
                  {currentStepData.description}
                </p>
              )}
              {currentStepData.optional && (
                <span className="inline-block mt-2 text-xs text-muted-foreground border border-muted px-2 py-1 rounded">
                  Optional
                </span>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div
                className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                role="alert"
              >
                {validationError}
              </div>
            )}

            {/* Step Content with Data Binding */}
            {React.cloneElement(currentStepData.content as React.ReactElement, {
              data: formData,
              onChange: setFormData,
            })}
          </div>
        </CardContent>

        {/* Navigation Buttons */}
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isValidating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting || isValidating}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStepData.optional && allowSkipOptional && !isLastStep && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting || isValidating}
              >
                Skip
              </Button>
            )}

            {!isLastStep ? (
              <Button
                onClick={handleNext}
                disabled={isSubmitting || isValidating}
              >
                {isValidating ? 'Validating...' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isValidating}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
                <Save className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Keyboard Hints */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <kbd className="px-2 py-1 bg-muted rounded">←</kbd> Previous •
        <kbd className="px-2 py-1 bg-muted rounded mx-1">→</kbd> Next •
        <kbd className="px-2 py-1 bg-muted rounded mx-1">Esc</kbd> Cancel
        {isLastStep && (
          <>
            {' '}•{' '}
            <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> Submit
          </>
        )}
      </div>
    </div>
  );
}

// Last Modified: 2025-11-24 21:25
/**
 * Multi-Step Forms - Complete Export Index
 *
 * This file provides a central export point for all multi-step form components
 * and utilities, making imports clean and consistent across the application.
 */

// Core Multi-Step Form Components
export { MultiStepForm } from './MultiStepForm';
export type { MultiStepFormProps, MultiStepFormStep } from './MultiStepForm';

// Auto-Save Provider
export { AutoSaveProvider, useAutoSave } from './AutoSaveProvider';

// Form Progress Tracker
export {
  FormProgressTracker,
  useFormProgress,
} from './FormProgressTracker';
export type { FieldStatus, FormProgressTrackerProps } from './FormProgressTracker';

// Side Panel Manager
export {
  SidePanelManager,
  useSidePanel,
  QuickEditPanel,
} from './SidePanelManager';

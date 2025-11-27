// Last Modified: 2025-11-23 17:30
/**
 * React Hook Form + Zod Integration
 * Adapter for using Zod schemas with react-hook-form
 */

import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

/**
 * Create a type-safe form resolver from a Zod schema
 *
 * Usage:
 * ```tsx
 * import { useForm } from 'react-hook-form';
 * import { createFormResolver } from '@/lib/validation/form-resolver';
 * import { loginSchema } from '@/lib/validation/schemas';
 *
 * const LoginForm = () => {
 *   const form = useForm({
 *     resolver: createFormResolver(loginSchema),
 *   });
 *   // ...
 * };
 * ```
 */
export function createFormResolver<T extends z.ZodType<any, any>>(schema: T) {
  return zodResolver(schema);
}

/**
 * Extract field errors from form state for display
 */
export function getFieldError(errors: any, fieldName: string): string | undefined {
  const error = errors[fieldName];
  return error?.message;
}

/**
 * Check if form has any errors
 */
export function hasFormErrors(errors: any): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get all error messages as an array
 */
export function getAllErrorMessages(errors: any): string[] {
  return Object.values(errors).map((error: any) => error?.message).filter(Boolean);
}

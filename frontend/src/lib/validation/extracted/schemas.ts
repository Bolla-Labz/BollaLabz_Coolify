// Last Modified: 2025-11-23 17:30
import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Agent Schemas
export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  vapiAssistantId: z.string().min(1, 'Vapi Assistant ID is required'),
  voiceId: z.string().min(1, 'Voice ID is required'),
  systemPrompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters')
    .max(5000, 'System prompt is too long'),
});

export const updateAgentSchema = createAgentSchema.partial();

// Phone Number Assignment Schema
export const assignAgentSchema = z.object({
  agentId: z.string().min(1, 'Agent is required'),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateAgentFormData = z.infer<typeof createAgentSchema>;
export type UpdateAgentFormData = z.infer<typeof updateAgentSchema>;
export type AssignAgentFormData = z.infer<typeof assignAgentSchema>;

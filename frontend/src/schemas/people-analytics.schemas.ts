// Last Modified: 2025-11-23 17:30
// Zod validation schemas for People Analytics data

import { z } from 'zod';

// Person Extended Schema
export const personExtendedSchema = z.object({
  id: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCountry: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  interests: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  relationshipScore: z.number().int().min(0).max(100).default(50),
  lastContactDate: z.date().optional(),
  contactFrequency: z.enum(['daily', 'weekly', 'monthly', 'rarely', 'never']).default('never'),
  totalInteractions: z.number().int().nonnegative().default(0),
  dataEnrichedAt: z.date().optional(),
  enrichmentSource: z.enum(['firecrawl', 'manual', 'api', 'social']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Interaction Analytic Schema
export const interactionAnalyticSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  interactionDate: z.date(),
  interactionType: z.enum(['call', 'sms', 'email', 'meeting', 'social', 'other']),
  durationSeconds: z.number().int().nonnegative().optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  topics: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
});

// Relationship Insight Schema
export const relationshipInsightSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  insightType: z.enum(['recommendation', 'warning', 'opportunity', 'milestone']),
  insightText: z.string().min(1, 'Insight text is required'),
  confidenceScore: z.number().min(0).max(100),
  isDismissed: z.boolean().default(false),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

// Social Media Activity Schema
export const socialMediaActivitySchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  platform: z.enum(['linkedin', 'twitter', 'facebook', 'instagram', 'other']),
  activityType: z.enum(['post', 'like', 'comment', 'share', 'mention']),
  activityUrl: z.string().url().optional().or(z.literal('')),
  contentPreview: z.string().optional(),
  activityDate: z.date(),
  createdAt: z.date(),
});

// LinkedIn Profile Schema
export const linkedInProfileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
  about: z.string().optional(),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  profileUrl: z.string().url(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

// Company Info Schema
export const companyInfoSchema = z.object({
  name: z.string().min(1),
  domain: z.string(),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  founded: z.number().int().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

// Enriched Person Data Schema
export const enrichedPersonDataSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: companyInfoSchema.optional(),
  linkedinProfile: linkedInProfileSchema.optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
  }).optional(),
  webPresence: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    snippet: z.string(),
    date: z.date().optional(),
    source: z.string(),
  })).optional(),
});

// Form Schemas (for creating/updating)
export const createPersonSchema = personExtendedSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePersonSchema = createPersonSchema.partial();

export const createInteractionSchema = interactionAnalyticSchema.omit({
  id: true,
  createdAt: true,
});

export const createInsightSchema = relationshipInsightSchema.omit({
  id: true,
  createdAt: true,
});

// Type exports
export type PersonExtendedInput = z.infer<typeof createPersonSchema>;
export type PersonExtendedUpdate = z.infer<typeof updatePersonSchema>;
export type InteractionAnalyticInput = z.infer<typeof createInteractionSchema>;
export type RelationshipInsightInput = z.infer<typeof createInsightSchema>;

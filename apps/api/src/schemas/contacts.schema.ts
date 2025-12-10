/**
 * Contact Validation Schemas
 * Zod schemas for contact CRUD operations
 */

import { z } from "zod";

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const contactCategorySchema = z.enum([
  "personal",
  "professional",
  "family",
  "friend",
  "client",
  "vendor",
  "partner",
  "other",
]);

export const contactSourceSchema = z.enum([
  "manual",
  "import",
  "google",
  "outlook",
  "icloud",
  "linkedin",
  "facebook",
  "api",
  "other",
]);

export const importanceSchema = z.enum(["low", "medium", "high", "critical"]);

export const relationshipTypeSchema = z.enum([
  "spouse",
  "parent",
  "child",
  "sibling",
  "relative",
  "friend",
  "colleague",
  "manager",
  "report",
  "partner",
  "other",
]);

// ============================================================================
// NESTED OBJECT SCHEMAS
// ============================================================================

export const addressSchema = z.object({
  street1: z.string().max(200).optional(),
  street2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  type: z.enum(["home", "work", "other"]).optional(),
});

export const relationshipSchema = z.object({
  contactId: z.string().uuid(),
  type: relationshipTypeSchema,
  notes: z.string().max(500).optional(),
});

// ============================================================================
// CREATE CONTACT SCHEMA
// ============================================================================

export const createContactSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less")
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be 255 characters or less")
    .optional(),
  phone: z
    .string()
    .max(30, "Phone must be 30 characters or less")
    .regex(/^[\d\s+\-().]+$/, "Invalid phone number format")
    .optional(),
  alternatePhone: z
    .string()
    .max(30, "Alternate phone must be 30 characters or less")
    .regex(/^[\d\s+\-().]+$/, "Invalid phone number format")
    .optional(),
  company: z.string().max(200, "Company must be 200 characters or less").trim().optional(),
  jobTitle: z.string().max(200, "Job title must be 200 characters or less").trim().optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  address: addressSchema.optional(),
  tags: z.array(z.string().max(50)).max(20, "Maximum 20 tags allowed").optional(),
  category: contactCategorySchema.optional(),
  source: contactSourceSchema.optional().default("manual"),
  importance: importanceSchema.optional(),
  relationships: z.array(relationshipSchema).max(50, "Maximum 50 relationships allowed").optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// UPDATE CONTACT SCHEMA
// ============================================================================

export const updateContactSchema = createContactSchema.partial();

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  pageSize: z.coerce
    .number()
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must be 100 or less")
    .default(20),
  q: z.string().max(200).optional(),
  search: z.string().max(200).optional(),
  category: contactCategorySchema.optional(),
  importance: importanceSchema.optional(),
  company: z.string().max(200).optional(),
  tag: z.string().max(50).optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "lastName", "firstName", "company"])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchContactsQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(500),
  limit: z.coerce.number().min(1).max(50).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.7),
});

export const contactIdParamSchema = z.object({
  id: z.string().uuid("Invalid contact ID format"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
export type SearchContactsQuery = z.infer<typeof searchContactsQuerySchema>;
export type ContactIdParam = z.infer<typeof contactIdParamSchema>;

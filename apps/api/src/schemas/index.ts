/**
 * API Schemas Index
 * Central export for all Zod validation schemas
 */

// Contact schemas
export {
  // Enum schemas
  contactCategorySchema,
  contactSourceSchema,
  importanceSchema,
  relationshipTypeSchema,
  // Nested object schemas
  addressSchema,
  relationshipSchema,
  // CRUD schemas
  createContactSchema,
  updateContactSchema,
  // Query schemas
  listContactsQuerySchema,
  searchContactsQuerySchema,
  contactIdParamSchema,
  // Types
  type CreateContactInput,
  type UpdateContactInput,
  type ListContactsQuery,
  type SearchContactsQuery,
  type ContactIdParam,
} from "./contacts.schema";

// Task schemas
export {
  // Enum schemas
  taskStatusSchema,
  taskPrioritySchema,
  recurrenceFrequencySchema,
  // Nested object schemas
  recurrenceRuleSchema,
  attachmentSchema,
  // CRUD schemas
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  // Query schemas
  listTasksQuerySchema,
  taskIdParamSchema,
  // Types
  type CreateTaskInput,
  type UpdateTaskInput,
  type UpdateTaskStatusInput,
  type ListTasksQuery,
  type TaskIdParam,
} from "./tasks.schema";

// Phone record schemas
export {
  // Enum schemas
  callDirectionSchema,
  callStatusSchema,
  // CRUD schemas
  createPhoneRecordSchema,
  updatePhoneRecordSchema,
  // Query schemas
  listPhoneRecordsQuerySchema,
  searchPhoneRecordsQuerySchema,
  phoneRecordStatsQuerySchema,
  phoneRecordIdParamSchema,
  // Types
  type CreatePhoneRecordInput,
  type UpdatePhoneRecordInput,
  type ListPhoneRecordsQuery,
  type SearchPhoneRecordsQuery,
  type PhoneRecordStatsQuery,
  type PhoneRecordIdParam,
} from "./phone-records.schema";

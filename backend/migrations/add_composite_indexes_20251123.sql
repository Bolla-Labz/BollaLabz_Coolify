-- Migration: Add Composite Indexes for Query Optimization
-- Date: 2025-11-23
-- Purpose: Add missing composite indexes to improve query performance for frequently accessed data patterns
-- Impact: Affects conversation_messages, call_costs, and scheduled_tasks tables
-- Status: EXECUTED SUCCESSFULLY - 2025-11-23 20:26
-- Last Modified: 2025-11-23 20:26

-- =============================================================================
-- MIGRATION UP (Apply Changes)
-- =============================================================================

-- 1. Contact message history (most frequent query pattern)
-- Optimizes: SELECT * FROM conversation_messages WHERE user_id = ? AND contact_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_contact_date
  ON conversation_messages(user_id, contact_id, created_at DESC);

COMMENT ON INDEX idx_conversation_messages_user_contact_date IS
  'Optimizes conversation message retrieval by user and contact with date sorting';

-- 2. Message type filtering with pagination
-- Optimizes: SELECT * FROM conversation_messages WHERE user_id = ? AND message_type = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_type_date
  ON conversation_messages(user_id, message_type, created_at DESC);

COMMENT ON INDEX idx_conversation_messages_user_type_date IS
  'Optimizes message type filtering queries with date sorting for pagination';

-- 3. User cost reports over time
-- Optimizes: SELECT * FROM call_costs WHERE user_id = ? ORDER BY billing_date DESC
CREATE INDEX IF NOT EXISTS idx_call_costs_user_billing_date
  ON call_costs(user_id, billing_date DESC);

COMMENT ON INDEX idx_call_costs_user_billing_date IS
  'Optimizes cost reporting queries for users over time';

-- 4. Active tasks query (partial index for efficiency)
-- Optimizes: SELECT * FROM scheduled_tasks WHERE user_id = ? AND status IN ('pending', 'in_progress') ORDER BY scheduled_for
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_active
  ON scheduled_tasks(user_id, scheduled_for)
  WHERE status IN ('pending', 'in_progress');

COMMENT ON INDEX idx_scheduled_tasks_active IS
  'Partial index for active tasks only, reduces index size and improves performance';

-- Update table statistics for query planner optimization
ANALYZE conversation_messages;
ANALYZE call_costs;
ANALYZE scheduled_tasks;

-- Verification query
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_conversation_messages_user_contact_date',
  'idx_conversation_messages_user_type_date',
  'idx_call_costs_user_billing_date',
  'idx_scheduled_tasks_active'
)
ORDER BY tablename, indexname;

-- =============================================================================
-- MIGRATION DOWN (Rollback Changes)
-- =============================================================================

-- Uncomment the following lines to rollback this migration:

-- DROP INDEX IF EXISTS idx_conversation_messages_user_contact_date;
-- DROP INDEX IF EXISTS idx_conversation_messages_user_type_date;
-- DROP INDEX IF EXISTS idx_call_costs_user_billing_date;
-- DROP INDEX IF EXISTS idx_scheduled_tasks_active;

-- ANALYZE conversation_messages;
-- ANALYZE call_costs;
-- ANALYZE scheduled_tasks;

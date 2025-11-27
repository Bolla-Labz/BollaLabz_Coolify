-- Last Modified: 2025-11-23 17:30
-- BollaLabz Database Performance Optimization Migration
-- Migration: 002_add_performance_indexes.sql
-- Purpose: Add comprehensive indexes to improve query performance
-- Target: <200ms API response times, >50% query speed improvement
-- Date: 2025-11-10

-- ============================================================================
-- PERFORMANCE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Phone Contacts Performance Indexes
-- Rationale: Frequent filtering by updated_at DESC in findAll()
CREATE INDEX IF NOT EXISTS idx_phone_contacts_updated_at_desc ON phone_contacts(updated_at DESC);

-- Rationale: Search queries use ILIKE on contact_name, contact_email
-- Text pattern matching indexes for faster ILIKE searches
CREATE INDEX IF NOT EXISTS idx_phone_contacts_name_pattern ON phone_contacts(contact_name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_phone_contacts_email_pattern ON phone_contacts(contact_email text_pattern_ops);

-- Rationale: Common filter for active contacts
CREATE INDEX IF NOT EXISTS idx_phone_contacts_active_updated ON phone_contacts(is_active, updated_at DESC) WHERE is_active = true;

-- Rationale: Analytics queries aggregate by last_contact_date
CREATE INDEX IF NOT EXISTS idx_phone_contacts_last_contact ON phone_contacts(last_contact_date DESC) WHERE last_contact_date IS NOT NULL;


-- Conversation Messages Performance Indexes
-- Rationale: Messages ordered by created_at DESC with contact filtering
CREATE INDEX IF NOT EXISTS idx_conversation_messages_contact_created ON conversation_messages(contact_id, created_at DESC);

-- Rationale: Filtering by direction and date range for analytics
CREATE INDEX IF NOT EXISTS idx_conversation_messages_direction_created ON conversation_messages(direction, created_at DESC);

-- Rationale: Message search with ILIKE on content
CREATE INDEX IF NOT EXISTS idx_conversation_messages_content_pattern ON conversation_messages(message_content text_pattern_ops);

-- Rationale: Filtering by message_type for call/sms/email breakdowns
CREATE INDEX IF NOT EXISTS idx_conversation_messages_type_created ON conversation_messages(message_type, created_at DESC);

-- Rationale: Grouping messages by conversation thread
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_timestamp ON conversation_messages(conversation_id, created_at ASC);


-- Call Costs Performance Indexes
-- Rationale: Cost analytics filter by billing_date range and aggregate
CREATE INDEX IF NOT EXISTS idx_call_costs_billing_date_desc ON call_costs(billing_date DESC);

-- Rationale: Service type breakdown for cost analysis
CREATE INDEX IF NOT EXISTS idx_call_costs_service_type_billing ON call_costs(service_type, billing_date DESC);

-- Rationale: Provider-specific cost tracking
CREATE INDEX IF NOT EXISTS idx_call_costs_provider_billing ON call_costs(service_provider, billing_date DESC);

-- Rationale: Daily cost aggregation queries
CREATE INDEX IF NOT EXISTS idx_call_costs_date_trunc ON call_costs(DATE(billing_date), service_type);


-- Scheduled Tasks Performance Indexes
-- Rationale: Task list filters by status with priority ordering
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status_priority ON scheduled_tasks(status, priority DESC, scheduled_for ASC NULLS LAST);

-- Rationale: Overdue task queries (status != 'completed' AND scheduled_for < NOW())
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_overdue ON scheduled_tasks(scheduled_for, status) WHERE status != 'completed' AND scheduled_for < NOW();

-- Rationale: Today's tasks query (DATE(scheduled_for) = CURRENT_DATE)
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_today ON scheduled_tasks(DATE(scheduled_for), priority DESC) WHERE status != 'completed';

-- Rationale: Task completion tracking for analytics
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_completed_at ON scheduled_tasks(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Rationale: Assignee filtering for user-specific task lists
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_assignee_status ON scheduled_tasks(assigned_to, status, scheduled_for);

-- Rationale: Dependency tree queries
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_depends_on ON scheduled_tasks(depends_on) WHERE depends_on IS NOT NULL;

-- Rationale: Created date analytics
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_created_at ON scheduled_tasks(created_at DESC);


-- Workflow Triggers Performance Indexes
-- Rationale: Active workflow filtering
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_active_updated ON workflow_triggers(is_active, updated_at DESC) WHERE is_active = true;

-- Rationale: Last triggered sorting for monitoring
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_last_triggered ON workflow_triggers(last_triggered DESC NULLS LAST);

-- Rationale: Trigger type filtering
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_type_active ON workflow_triggers(trigger_type, is_active);


-- People Performance Indexes
-- Rationale: People search by full_name with ILIKE
CREATE INDEX IF NOT EXISTS idx_people_name_pattern ON people(full_name text_pattern_ops);

-- Rationale: Contact relationship lookups
CREATE INDEX IF NOT EXISTS idx_people_contact_id ON people(contact_id) WHERE contact_id IS NOT NULL;

-- Rationale: Company and job title filtering
CREATE INDEX IF NOT EXISTS idx_people_company ON people(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_job_title ON people(job_title) WHERE job_title IS NOT NULL;

-- Rationale: Relationship type queries
CREATE INDEX IF NOT EXISTS idx_people_relationship_type ON people(relationship_type) WHERE relationship_type IS NOT NULL;

-- Rationale: Relationship strength sorting
CREATE INDEX IF NOT EXISTS idx_people_relationship_strength ON people(relationship_strength DESC) WHERE relationship_strength IS NOT NULL;

-- Rationale: Tag-based searches (GIN index already exists, add partial for common use)
CREATE INDEX IF NOT EXISTS idx_people_tags_active ON people USING GIN(tags) WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Rationale: Recent updates tracking
CREATE INDEX IF NOT EXISTS idx_people_updated_at ON people(updated_at DESC);


-- Relationship Interactions Performance Indexes
-- Rationale: Person interaction history with timestamp ordering
CREATE INDEX IF NOT EXISTS idx_relationship_interactions_person_date ON relationship_interactions(person_id, interaction_date DESC);

-- Rationale: Interaction type filtering
CREATE INDEX IF NOT EXISTS idx_relationship_interactions_type_date ON relationship_interactions(interaction_type, interaction_date DESC);

-- Rationale: Follow-up required queries
CREATE INDEX IF NOT EXISTS idx_relationship_interactions_followup ON relationship_interactions(follow_up_required, follow_up_date) WHERE follow_up_required = true;

-- Rationale: Sentiment analysis queries
CREATE INDEX IF NOT EXISTS idx_relationship_interactions_sentiment ON relationship_interactions(sentiment, interaction_date DESC) WHERE sentiment IS NOT NULL;


-- Calendar Events Performance Indexes
-- Rationale: Event queries by date range
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_end ON calendar_events(start_time, end_time);

-- Rationale: Event type filtering
CREATE INDEX IF NOT EXISTS idx_calendar_events_type_start ON calendar_events(event_type, start_time);

-- Rationale: All-day events queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_all_day ON calendar_events(is_all_day, start_time) WHERE is_all_day = true;

-- Rationale: Recurring events lookup
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence ON calendar_events(recurrence_rule) WHERE recurrence_rule IS NOT NULL;

-- Rationale: External calendar sync queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON calendar_events(external_id) WHERE external_id IS NOT NULL;


-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Rationale: Analytics dashboard - contact stats with date filtering
CREATE INDEX IF NOT EXISTS idx_phone_contacts_analytics ON phone_contacts(created_at, last_contact_date, conversation_count);

-- Rationale: Message analytics - daily breakdown by direction
CREATE INDEX IF NOT EXISTS idx_conversation_messages_daily_stats ON conversation_messages(DATE(created_at), direction);

-- Rationale: Top contacts by message volume
CREATE INDEX IF NOT EXISTS idx_conversation_messages_contact_count ON conversation_messages(contact_id, created_at);

-- Rationale: Task status distribution
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status_date ON scheduled_tasks(status, created_at);


-- ============================================================================
-- JSONB INDEXES FOR METADATA QUERIES
-- ============================================================================

-- Rationale: Metadata searches in conversation messages
CREATE INDEX IF NOT EXISTS idx_conversation_messages_metadata ON conversation_messages USING GIN(metadata) WHERE metadata IS NOT NULL;

-- Rationale: Metadata searches in call costs
CREATE INDEX IF NOT EXISTS idx_call_costs_metadata ON call_costs USING GIN(metadata) WHERE metadata IS NOT NULL;

-- Rationale: Task metadata searches
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_metadata ON scheduled_tasks USING GIN(metadata) WHERE metadata IS NOT NULL;

-- Rationale: Workflow trigger conditions and actions
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_conditions ON workflow_triggers USING GIN(conditions) WHERE conditions IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_actions ON workflow_triggers USING GIN(actions) WHERE actions IS NOT NULL;

-- Rationale: People preferences and metadata
CREATE INDEX IF NOT EXISTS idx_people_preferences ON people USING GIN(preferences) WHERE preferences IS NOT NULL;


-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Rationale: Pending tasks are queried frequently
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_pending ON scheduled_tasks(scheduled_for, priority DESC) WHERE status = 'pending';

-- Rationale: In-progress tasks for active work tracking
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_in_progress ON scheduled_tasks(updated_at DESC) WHERE status = 'in_progress';

-- Rationale: Failed tasks for error monitoring
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_failed ON scheduled_tasks(created_at DESC) WHERE status = 'failed';

-- Rationale: Inbound message filtering
CREATE INDEX IF NOT EXISTS idx_conversation_messages_inbound ON conversation_messages(created_at DESC, contact_id) WHERE direction = 'inbound';

-- Rationale: Outbound message filtering
CREATE INDEX IF NOT EXISTS idx_conversation_messages_outbound ON conversation_messages(created_at DESC, contact_id) WHERE direction = 'outbound';


-- ============================================================================
-- COVERING INDEXES FOR FREQUENT READ QUERIES
-- ============================================================================

-- Rationale: Contact list query covers most columns to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_phone_contacts_list_covering
ON phone_contacts(updated_at DESC)
INCLUDE (id, phone_number, contact_name, contact_email, conversation_count, last_contact_date);


-- ============================================================================
-- ANALYZE TABLES TO UPDATE STATISTICS
-- ============================================================================

-- Update query planner statistics after creating indexes
ANALYZE phone_contacts;
ANALYZE conversation_messages;
ANALYZE call_costs;
ANALYZE scheduled_tasks;
ANALYZE workflow_triggers;
ANALYZE people;
ANALYZE relationship_interactions;
ANALYZE calendar_events;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check total number of indexes per table
SELECT
    tablename,
    COUNT(*) as index_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename, schemaname
ORDER BY tablename;

-- Check index sizes
SELECT
    schemaname || '.' || tablename AS table,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
LIMIT 20;

-- Migration complete
SELECT 'Performance indexes migration completed successfully!' as status;

<!-- Last Modified: 2025-11-23 18:45 -->
# Database Migrations

## Overview

This directory contains SQL migration scripts for the BollaLabz database. Migrations are applied sequentially to evolve the database schema and optimize performance.

## Migration Files

### 001_initial_schema.sql (see database-schema.sql in root)
Initial database schema with core tables and basic indexes.

### 002_add_performance_indexes.sql
**Performance Optimization Migration**

### add_composite_indexes_20251123.sql
**Composite Indexes for Query Optimization** - Added 2025-11-23

Adds critical composite indexes for the most frequent query patterns in production.

**Status:** ✅ Ready for execution

**Indexes Added:**
1. `idx_conversation_messages_user_contact_date` - Optimizes contact message history retrieval (user_id, contact_id, created_at DESC)
2. `idx_conversation_messages_user_type_date` - Optimizes message type filtering with pagination (user_id, message_type, created_at DESC)
3. `idx_call_costs_user_billing_date` - Optimizes user cost reports over time (user_id, billing_date DESC)
4. `idx_scheduled_tasks_active` - Partial index for active tasks only (user_id, scheduled_for WHERE status IN ('pending', 'in_progress'))

**Expected Performance Impact:**
- Contact conversation queries: 60-80% faster
- Message type filtering: 50-70% faster
- Cost report generation: 40-60% faster
- Active task queries: 70-85% faster (partial index advantage)

**Execution Options:**

```bash
# Option 1: Using Node.js runner script
cd backend && node migrations/run-migration.js

# Option 2: Direct SQL execution (if psql available)
psql $DATABASE_URL -f backend/migrations/add_composite_indexes_20251123.sql

# Option 3: Via Railway CLI
railway run --service=bollalabz-backend -- sh -c "cd backend && node migrations/run-migration.js"
```

**Verification Query:**
```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_conversation_messages_user_contact_date',
  'idx_conversation_messages_user_type_date',
  'idx_call_costs_user_billing_date',
  'idx_scheduled_tasks_active'
)
ORDER BY tablename, indexname;
```

---

### 002_add_performance_indexes.sql (Legacy)
**Performance Optimization Migration**

Adds comprehensive indexes to improve query performance across all tables.

**Target Metrics:**
- API response times: <200ms
- Query speed improvement: >50%
- Slow query reduction: >80%

**Key Improvements:**

1. **Pattern Matching Indexes** (text_pattern_ops)
   - Faster ILIKE searches on contact_name, contact_email, message_content
   - Essential for search functionality

2. **Composite Indexes**
   - Multi-column indexes for common filter combinations
   - Reduces query planning time and improves join performance

3. **Partial Indexes**
   - Indexes with WHERE clauses for common filters
   - Smaller index size, faster updates
   - Examples: active contacts, pending tasks, inbound messages

4. **JSONB GIN Indexes**
   - Fast searches in metadata, conditions, preferences fields
   - Supports complex JSONB queries

5. **Covering Indexes**
   - Include frequently accessed columns
   - Reduces table lookups (index-only scans)

6. **Time-Series Indexes**
   - Optimized for date range queries
   - DESC ordering for recent-first queries

## Applying Migrations

### Manual Application

```bash
# Connect to database
psql -U bollalabz -d bollalabz -h localhost

# Apply migration
\i backend/migrations/002_add_performance_indexes.sql
```

### Using Node.js Script

```bash
cd backend
node scripts/apply-performance-migration.js
```

### Using Docker

```bash
# Copy migration to container
docker cp backend/migrations/002_add_performance_indexes.sql bollalabz-postgres:/tmp/

# Execute in container
docker exec -i bollalabz-postgres psql -U bollalabz -d bollalabz -f /tmp/002_add_performance_indexes.sql
```

## Verifying Performance

### 1. Check Index Creation

```sql
-- Count indexes per table
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### 2. Test Query Performance

```sql
-- Explain a query to see if indexes are used
EXPLAIN ANALYZE
SELECT * FROM phone_contacts
WHERE contact_name ILIKE '%john%'
ORDER BY updated_at DESC
LIMIT 20;
```

Look for:
- "Index Scan" or "Index Only Scan" (good)
- NOT "Seq Scan" on large tables (bad)
- Execution time <50ms for typical queries

### 3. Monitor via API

```bash
# Check database health and performance
curl http://localhost:5000/api/v1/health/database

# View query statistics
curl http://localhost:5000/api/v1/health

# Check for slow queries
curl http://localhost:5000/api/v1/health/database/slow-queries
```

### 4. Cache Hit Ratio

Target: >95% cache hit ratio

```sql
SELECT
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;
```

## Index Maintenance

### Unused Indexes

Periodically check for unused indexes:

```sql
SELECT
    schemaname || '.' || tablename AS table,
    indexname,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

Indexes with `idx_scan = 0` may be candidates for removal.

### Reindex

If indexes become bloated or corrupted:

```sql
-- Reindex a specific table
REINDEX TABLE phone_contacts;

-- Reindex entire database (requires exclusive lock)
REINDEX DATABASE bollalabz;
```

### Update Statistics

After significant data changes:

```sql
-- Update statistics for query planner
ANALYZE;

-- Or for specific table
ANALYZE phone_contacts;
```

## Performance Best Practices

### Query Optimization

1. **Always use LIMIT** for list queries
   ```sql
   SELECT * FROM conversation_messages
   ORDER BY created_at DESC
   LIMIT 50;  -- Good
   ```

2. **Avoid SELECT ***
   ```sql
   -- Bad
   SELECT * FROM phone_contacts;

   -- Good
   SELECT id, contact_name, phone_number FROM phone_contacts;
   ```

3. **Use specific columns in WHERE clauses**
   ```sql
   -- Good - uses index
   WHERE contact_id = 123

   -- Bad - can't use index efficiently
   WHERE LOWER(contact_name) = 'john'
   ```

4. **Batch INSERT operations**
   ```sql
   -- Good
   INSERT INTO tasks (title, status) VALUES
     ('Task 1', 'pending'),
     ('Task 2', 'pending'),
     ('Task 3', 'pending');

   -- Bad - separate inserts
   INSERT INTO tasks (title, status) VALUES ('Task 1', 'pending');
   INSERT INTO tasks (title, status) VALUES ('Task 2', 'pending');
   INSERT INTO tasks (title, status) VALUES ('Task 3', 'pending');
   ```

### Connection Pooling

Current settings (configured in `config/database.js`):
- Max connections: 20
- Min connections: 2
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

### Monitoring

Key metrics to track:
- Average query time: <50ms
- Slow queries (>100ms): <5%
- Very slow queries (>500ms): <1%
- Cache hit ratio: >95%
- Active connections: <80% of max
- Index usage: >90% of indexes actively used

## Rollback

If migration causes issues:

```sql
-- List all indexes created by migration
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Drop specific index
DROP INDEX IF EXISTS idx_phone_contacts_updated_at_desc;

-- Or drop all indexes from migration (CAREFUL!)
-- See rollback script: migrations/002_rollback.sql
```

## Future Migrations

Guidelines for new migrations:
1. Number sequentially (003, 004, etc.)
2. Include rollback instructions
3. Test on staging before production
4. Document performance impact
5. Update this README

## Resources

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [EXPLAIN ANALYZE Guide](https://www.postgresql.org/docs/current/using-explain.html)

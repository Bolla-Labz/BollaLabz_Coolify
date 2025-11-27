#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Apply Performance Optimization Migration
 * Applies database indexes and verifies performance improvements
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bollalabz',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function applyMigration() {
  console.log('🚀 Starting performance optimization migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_add_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📊 Collecting pre-migration statistics...\n');

    // Get pre-migration statistics
    const preMigrationStats = await collectStats();
    console.log('Pre-migration statistics:');
    console.log(`  Total indexes: ${preMigrationStats.totalIndexes}`);
    console.log(`  Database size: ${preMigrationStats.databaseSize}`);
    console.log(`  Cache hit ratio: ${preMigrationStats.cacheHitRatio}\n`);

    // Apply migration
    console.log('⚡ Applying migration...');
    const startTime = Date.now();

    await pool.query(migrationSQL);

    const duration = Date.now() - startTime;
    console.log(`✅ Migration completed in ${duration}ms\n`);

    // Get post-migration statistics
    console.log('📊 Collecting post-migration statistics...\n');
    const postMigrationStats = await collectStats();

    // Display results
    console.log('Post-migration statistics:');
    console.log(`  Total indexes: ${postMigrationStats.totalIndexes} (+${postMigrationStats.totalIndexes - preMigrationStats.totalIndexes})`);
    console.log(`  Database size: ${postMigrationStats.databaseSize}`);
    console.log(`  Cache hit ratio: ${postMigrationStats.cacheHitRatio}\n`);

    // Display index details
    console.log('📋 Index Summary by Table:');
    for (const table of postMigrationStats.indexesByTable) {
      console.log(`  ${table.tablename}: ${table.index_count} indexes (${table.table_size})`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test API endpoints to verify performance');
    console.log('  2. Monitor query times via /api/v1/health/database');
    console.log('  3. Check for slow queries with EXPLAIN ANALYZE');
    console.log('  4. Adjust indexes based on actual query patterns\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function collectStats() {
  // Count total indexes
  const indexCountResult = await pool.query(`
    SELECT COUNT(*) as total
    FROM pg_indexes
    WHERE schemaname = 'public'
  `);

  // Database size
  const dbSizeResult = await pool.query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `);

  // Cache hit ratio
  const cacheHitResult = await pool.query(`
    SELECT
      COALESCE(sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 0) as ratio
    FROM pg_statio_user_tables
  `);

  // Indexes by table
  const indexesByTableResult = await pool.query(`
    SELECT
      tablename,
      COUNT(*) as index_count,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY tablename, schemaname
    ORDER BY tablename
  `);

  return {
    totalIndexes: parseInt(indexCountResult.rows[0].total),
    databaseSize: dbSizeResult.rows[0].size,
    cacheHitRatio: parseFloat(cacheHitResult.rows[0].ratio).toFixed(2) + '%',
    indexesByTable: indexesByTableResult.rows
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigration();
}

export { applyMigration };

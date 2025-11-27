#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Database Performance Testing Script
 * Tests query performance before and after optimization
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bollalabz',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test queries based on actual application usage
const testQueries = [
  {
    name: 'Contact List with Pagination',
    query: `
      SELECT id, phone_number, contact_name, contact_email, conversation_count, last_contact_date
      FROM phone_contacts
      ORDER BY updated_at DESC
      LIMIT 20 OFFSET 0
    `,
    expectedTime: 50 // ms
  },
  {
    name: 'Contact Search (ILIKE)',
    query: `
      SELECT id, phone_number, contact_name, contact_email
      FROM phone_contacts
      WHERE contact_name ILIKE '%test%'
      ORDER BY updated_at DESC
      LIMIT 20
    `,
    expectedTime: 100 // ms
  },
  {
    name: 'Message History by Contact',
    query: `
      SELECT cm.*, pc.contact_name, pc.phone_number
      FROM conversation_messages cm
      LEFT JOIN phone_contacts pc ON cm.contact_id = pc.id
      WHERE cm.contact_id = 1
      ORDER BY cm.created_at DESC
      LIMIT 50
    `,
    expectedTime: 50 // ms
  },
  {
    name: 'Task List with Status Filter',
    query: `
      SELECT id, task_name, status, priority, scheduled_for
      FROM scheduled_tasks
      WHERE status = 'pending'
      ORDER BY priority DESC, scheduled_for ASC NULLS LAST
      LIMIT 20
    `,
    expectedTime: 50 // ms
  },
  {
    name: 'Overdue Tasks Query',
    query: `
      SELECT id, task_name, scheduled_for, priority
      FROM scheduled_tasks
      WHERE status != 'completed'
      AND scheduled_for < NOW()
      ORDER BY scheduled_for ASC
    `,
    expectedTime: 50 // ms
  },
  {
    name: 'Daily Message Breakdown',
    query: `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as messages,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound
      FROM conversation_messages
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
    expectedTime: 100 // ms
  },
  {
    name: 'Top Contacts by Message Volume',
    query: `
      SELECT
        pc.id, pc.contact_name, pc.phone_number,
        COUNT(*) as message_count
      FROM conversation_messages cm
      JOIN phone_contacts pc ON cm.contact_id = pc.id
      GROUP BY pc.id, pc.contact_name, pc.phone_number
      ORDER BY message_count DESC
      LIMIT 10
    `,
    expectedTime: 100 // ms
  },
  {
    name: 'Call Cost Analytics',
    query: `
      SELECT
        service_type,
        COUNT(*) as calls,
        SUM(cost_amount) as total_cost,
        AVG(cost_amount) as avg_cost
      FROM call_costs
      WHERE billing_date >= NOW() - INTERVAL '30 days'
      GROUP BY service_type
    `,
    expectedTime: 50 // ms
  },
  {
    name: 'Calendar Events This Week',
    query: `
      SELECT id, event_title, start_time, end_time, event_type
      FROM calendar_events
      WHERE start_time >= NOW()
      AND start_time < NOW() + INTERVAL '7 days'
      ORDER BY start_time ASC
    `,
    expectedTime: 50 // ms
  },
  {
    name: 'Person Interactions History',
    query: `
      SELECT interaction_type, interaction_date, interaction_summary
      FROM relationship_interactions
      WHERE person_id = 1
      ORDER BY interaction_date DESC
      LIMIT 50
    `,
    expectedTime: 50 // ms
  }
];

async function runPerformanceTests() {
  console.log('🚀 Starting Database Performance Tests\n');
  console.log('=' .repeat(80) + '\n');

  const results = {
    passed: 0,
    failed: 0,
    total: testQueries.length,
    tests: []
  };

  for (const test of testQueries) {
    console.log(`Testing: ${test.name}`);

    try {
      // Run query multiple times for average
      const runs = 3;
      const times = [];

      for (let i = 0; i < runs; i++) {
        const start = Date.now();
        await pool.query(test.query);
        const duration = Date.now() - start;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / runs;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      const passed = avgTime <= test.expectedTime;
      const status = passed ? '✅ PASS' : '❌ FAIL';

      console.log(`  ${status} - Avg: ${avgTime.toFixed(2)}ms (Min: ${minTime}ms, Max: ${maxTime}ms, Expected: <${test.expectedTime}ms)`);

      // Get query plan
      const explainResult = await pool.query(`EXPLAIN (FORMAT JSON) ${test.query}`);
      const plan = explainResult.rows[0]['QUERY PLAN'][0];
      const usesIndex = JSON.stringify(plan).includes('Index');

      console.log(`  📊 Uses Index: ${usesIndex ? 'Yes' : 'No'}`);

      if (!passed) {
        console.log(`  ⚠️  Performance degraded! Expected <${test.expectedTime}ms but got ${avgTime.toFixed(2)}ms`);
      }

      console.log('');

      results.tests.push({
        name: test.name,
        passed,
        avgTime: parseFloat(avgTime.toFixed(2)),
        minTime,
        maxTime,
        expectedTime: test.expectedTime,
        usesIndex
      });

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}\n`);
      results.failed++;
      results.tests.push({
        name: test.name,
        passed: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('=' .repeat(80));
  console.log('\n📊 Test Summary:\n');
  console.log(`  Total Tests: ${results.total}`);
  console.log(`  Passed: ${results.passed} (${(results.passed / results.total * 100).toFixed(1)}%)`);
  console.log(`  Failed: ${results.failed} (${(results.failed / results.total * 100).toFixed(1)}%)`);

  // Calculate overall performance
  const avgPerformance = results.tests
    .filter(t => t.avgTime)
    .reduce((sum, t) => sum + t.avgTime, 0) / results.tests.filter(t => t.avgTime).length;

  console.log(`\n  Average Query Time: ${avgPerformance.toFixed(2)}ms`);

  // Index usage stats
  const indexUsage = results.tests.filter(t => t.usesIndex).length;
  console.log(`  Index Usage: ${indexUsage}/${results.total} queries (${(indexUsage / results.total * 100).toFixed(1)}%)`);

  // Performance grade
  let grade = 'F';
  if (results.passed === results.total && avgPerformance < 50) grade = 'A+';
  else if (results.passed === results.total && avgPerformance < 100) grade = 'A';
  else if (results.passed >= results.total * 0.9) grade = 'B';
  else if (results.passed >= results.total * 0.8) grade = 'C';
  else if (results.passed >= results.total * 0.7) grade = 'D';

  console.log(`\n  Performance Grade: ${grade}`);

  // Recommendations
  console.log('\n💡 Recommendations:\n');

  if (avgPerformance > 100) {
    console.log('  ⚠️  Average query time >100ms - Consider:');
    console.log('     - Running ANALYZE on tables');
    console.log('     - Checking for missing indexes');
    console.log('     - Reviewing slow queries in pg_stat_statements');
  }

  if (indexUsage < results.total * 0.8) {
    console.log('  ⚠️  Low index usage - Consider:');
    console.log('     - Adding indexes for sequential scans');
    console.log('     - Reviewing query patterns');
  }

  const failedTests = results.tests.filter(t => !t.passed && t.avgTime);
  if (failedTests.length > 0) {
    console.log(`\n  ⚠️  ${failedTests.length} slow queries detected:`);
    failedTests.forEach(t => {
      console.log(`     - ${t.name}: ${t.avgTime}ms (expected <${t.expectedTime}ms)`);
    });
  }

  if (grade === 'A+' || grade === 'A') {
    console.log('  ✅ Excellent performance! All queries optimized.');
  }

  console.log('\n' + '=' .repeat(80) + '\n');

  return results;
}

async function main() {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Run tests
    const results = await runPerformanceTests();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runPerformanceTests };

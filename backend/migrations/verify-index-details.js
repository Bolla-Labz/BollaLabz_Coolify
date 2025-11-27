// Detailed Index Verification Script
// Last Modified: 2025-11-23 20:25

import pkg from 'pg';
const { Pool } = pkg;

async function verifyIndexDetails() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully\n');

    const indexNames = [
      'idx_conversation_messages_user_contact_date',
      'idx_conversation_messages_user_type_date',
      'idx_call_costs_user_billing_date',
      'idx_scheduled_tasks_active'
    ];

    console.log('📋 Detailed Index Information:\n');
    console.log('='.repeat(100));

    for (const indexName of indexNames) {
      const query = `
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE indexname = $1;
      `;

      const result = await client.query(query, [indexName]);

      if (result.rows.length > 0) {
        const index = result.rows[0];
        console.log(`\n✅ ${index.indexname}`);
        console.log(`   Table: ${index.tablename}`);
        console.log(`   Schema: ${index.schemaname}`);
        console.log(`   Definition:\n   ${index.indexdef}`);
      } else {
        console.log(`\n❌ ${indexName} - NOT FOUND`);
      }
    }

    console.log('\n' + '='.repeat(100));

    // Check for partial index condition on scheduled_tasks_active
    console.log('\n🔍 Checking Partial Index Condition:\n');
    const partialIndexQuery = `
      SELECT
        pg_get_expr(indpred, indrelid) as index_predicate
      FROM pg_index
      JOIN pg_class ON pg_class.oid = pg_index.indexrelid
      WHERE pg_class.relname = 'idx_scheduled_tasks_active';
    `;

    const partialResult = await client.query(partialIndexQuery);
    if (partialResult.rows.length > 0 && partialResult.rows[0].index_predicate) {
      console.log(`✅ Partial index condition found:`);
      console.log(`   ${partialResult.rows[0].index_predicate}`);
    } else {
      console.log('❌ No partial index condition found for idx_scheduled_tasks_active');
    }

    console.log('\n' + '='.repeat(100));

    // Test query performance with EXPLAIN
    console.log('\n📊 Query Performance Analysis:\n');

    const testQueries = [
      {
        name: 'Contact message history',
        query: `EXPLAIN SELECT * FROM conversation_messages WHERE user_id = 1 AND contact_id = 1 ORDER BY created_at DESC LIMIT 10;`
      },
      {
        name: 'Message type filtering',
        query: `EXPLAIN SELECT * FROM conversation_messages WHERE user_id = 1 AND message_type = 'sms' ORDER BY created_at DESC LIMIT 10;`
      },
      {
        name: 'User cost reports',
        query: `EXPLAIN SELECT * FROM call_costs WHERE user_id = 1 ORDER BY billing_date DESC LIMIT 10;`
      },
      {
        name: 'Active tasks',
        query: `EXPLAIN SELECT * FROM scheduled_tasks WHERE user_id = 1 AND status IN ('pending', 'in_progress') ORDER BY scheduled_for LIMIT 10;`
      }
    ];

    for (const test of testQueries) {
      console.log(`\n${test.name}:`);
      try {
        const result = await client.query(test.query);
        result.rows.forEach(row => {
          console.log(`   ${row['QUERY PLAN']}`);
        });
      } catch (error) {
        console.log(`   ⚠️ Query test skipped: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(100));

    client.release();
    await pool.end();

    console.log('\n✅ Verification completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verifyIndexDetails();

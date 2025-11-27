// Index Verification Script
// Last Modified: 2025-11-23 18:50

import pkg from 'pg';
const { Pool } = pkg;

async function verifyIndexes() {
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

    console.log('🔍 Checking for required indexes...\n');

    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE indexname = ANY($1)
      ORDER BY tablename, indexname;
    `;

    const result = await client.query(query, [indexNames]);

    console.log('📊 Index Status Report');
    console.log('='.repeat(80));

    const foundIndexes = result.rows.map(r => r.indexname);
    const missingIndexes = indexNames.filter(name => !foundIndexes.includes(name));

    if (result.rows.length > 0) {
      console.log('\n✅ Found Indexes:');
      result.rows.forEach(row => {
        console.log(`\n   Index: ${row.indexname}`);
        console.log(`   Table: ${row.tablename}`);
        console.log(`   Definition: ${row.indexdef.substring(0, 100)}...`);
      });
    }

    if (missingIndexes.length > 0) {
      console.log('\n❌ Missing Indexes:');
      missingIndexes.forEach(name => {
        console.log(`   - ${name}`);
      });
      console.log('\n⚠️  Migration has not been applied yet!');
      console.log('   Run: node migrations/run-migration.js');
    } else {
      console.log('\n✅ All required indexes are present!');
    }

    console.log('\n' + '='.repeat(80));

    // Get index usage statistics
    console.log('\n📈 Index Usage Statistics:');
    const usageQuery = `
      SELECT
        indexrelname as index_name,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE indexrelname = ANY($1)
      ORDER BY idx_scan DESC;
    `;

    const usageResult = await client.query(usageQuery, [indexNames]);

    if (usageResult.rows.length > 0) {
      usageResult.rows.forEach(row => {
        console.log(`\n   ${row.index_name}:`);
        console.log(`      Scans: ${row.scans}`);
        console.log(`      Tuples Read: ${row.tuples_read}`);
        console.log(`      Tuples Fetched: ${row.tuples_fetched}`);
        console.log(`      Size: ${row.size}`);
      });
    } else {
      console.log('   No usage statistics available yet (indexes recently created)');
    }

    console.log('\n');

    client.release();
    await pool.end();

    process.exit(missingIndexes.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verifyIndexes();

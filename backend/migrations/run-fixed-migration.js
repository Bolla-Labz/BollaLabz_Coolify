// Migration Runner Script - Fixed Version
// Last Modified: 2025-11-23 20:21

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully\n');

    // Read fixed migration file
    const migrationPath = path.join(__dirname, 'add_composite_indexes_fixed.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚙️  Executing migration SQL...\n');

    try {
      // Execute the entire migration as a single transaction
      await client.query('BEGIN');
      const result = await client.query(sql);
      await client.query('COMMIT');

      console.log('✅ Migration executed successfully!\n');

      // Show verification results if available
      if (result.rows && result.rows.length > 0) {
        console.log('📋 Created Indexes:');
        result.rows.forEach(row => {
          console.log(`   ✅ ${row.indexname} on ${row.tablename}`);
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    client.release();
    await pool.end();

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    if (error.hint) console.error('   Hint:', error.hint);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

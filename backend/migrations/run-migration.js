// Migration Runner Script
// Last Modified: 2025-11-23 18:35

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
    console.log('✅ Connected successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, 'add_composite_indexes_20251123.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements (filter out comments and empty lines)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.includes('MIGRATION DOWN') || stmt.includes('=====')) {
        continue; // Skip section headers
      }

      try {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);

        // Show first 100 chars of statement
        const preview = stmt.substring(0, 100).replace(/\n/g, ' ');
        console.log(`   ${preview}${stmt.length > 100 ? '...' : ''}`);

        const result = await client.query(stmt);

        if (result.rows && result.rows.length > 0) {
          console.log(`✅ Success - ${result.rows.length} rows returned`);
          // Show results for verification query
          if (stmt.includes('pg_indexes')) {
            console.log('\n📋 Created Indexes:');
            result.rows.forEach(row => {
              console.log(`   - ${row.indexname} on ${row.tablename}`);
            });
          }
        } else {
          console.log(`✅ Success - ${result.command || 'Executed'}`);
        }

        successCount++;
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        errorCount++;
      }
      console.log('');
    }

    client.release();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(60));

    await pool.end();
    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

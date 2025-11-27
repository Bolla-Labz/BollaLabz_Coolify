// Deploy database schema to Railway Postgres
// Run with: node deploy-db-schema.js

const fs = require('fs');
const pg = require('pg');

// Use DATABASE_PUBLIC_URL for external connections
const DATABASE_URL = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL or DATABASE_PUBLIC_URL environment variable not set');
  console.error('Run with: npx @railway/cli run --service Postgres node deploy-db-schema.cjs');
  process.exit(1);
}

console.log('Using database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

async function deploySchema() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected to database');

    // Read schema file
    console.log('Reading schema file...');
    const schema = fs.readFileSync('./deploy-schema.sql', 'utf8');
    console.log('✓ Schema file loaded');

    // Execute schema
    console.log('Executing schema...');
    const result = await client.query(schema);
    console.log('✓ Schema deployed successfully');

    // Verify tables exist
    console.log('\nVerifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`✓ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Count rows in each table
    console.log('\nTable row counts:');
    for (const row of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`  ${row.table_name}: ${countResult.rows[0].count} rows`);
    }

    console.log('\n✅ Schema deployment completed successfully!');

  } catch (error) {
    console.error('❌ Error deploying schema:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deploySchema();
#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Setup Database on VPS
 * Creates database and user, then applies schema
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Client } = pg;

// VPS database connection
const vpsHost = process.env.VPS_IP || '31.220.55.252';
const dbUser = 'bollalabz';
const dbPassword = 'BollaL@bz2025Secure!';
const dbName = 'bollalabz';

async function setupDatabase() {
  console.log('🚀 BollaLabz Database Setup\n');

  // First connect to postgres database to create our database
  console.log('📡 Connecting to VPS PostgreSQL...');
  const adminClient = new Client({
    host: vpsHost,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'BollaL@bz2025Secure!',
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Create user if not exists
    console.log(`🔐 Creating user: ${dbUser}`);
    try {
      await adminClient.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${dbUser}') THEN
            CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';
          END IF;
        END
        $$;
      `);
      console.log('✅ User created or already exists\n');
    } catch (err) {
      if (err.code !== '42710') throw err; // Ignore "already exists" error
    }

    // Create database if not exists
    console.log(`📦 Creating database: ${dbName}`);
    try {
      await adminClient.query(`CREATE DATABASE ${dbName} OWNER ${dbUser};`);
      console.log('✅ Database created\n');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('ℹ️  Database already exists\n');
      } else {
        throw err;
      }
    }

    await adminClient.end();

    // Now connect to our database and apply schema
    console.log('📊 Applying database schema...');
    const dbClient = new Client({
      host: vpsHost,
      port: 5432,
      database: dbName,
      user: dbUser,
      password: dbPassword,
    });

    await dbClient.connect();

    // Read and apply schema
    const schemaPath = path.join(__dirname, '../../database-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await dbClient.query(schemaSql);
    console.log('✅ Schema applied successfully\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tablesResult = await dbClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`✅ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Count rows
    console.log('\n📊 Table row counts:');
    for (const row of tablesResult.rows) {
      const countResult = await dbClient.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`   ${row.table_name}: ${countResult.rows[0].count} rows`);
    }

    await dbClient.end();

    console.log('\n✅ Database setup complete!');
    console.log('\n📝 Update your .env file with:');
    console.log(`DB_HOST=${vpsHost}`);
    console.log(`DB_PORT=5432`);
    console.log(`DB_USER=${dbUser}`);
    console.log(`DB_PASSWORD=${dbPassword}`);
    console.log(`DB_NAME=${dbName}`);
    console.log(`DATABASE_URL=postgresql://${dbUser}:${dbPassword}@${vpsHost}:5432/${dbName}`);

  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error(error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check if PostgreSQL is running on the VPS');
      console.error('   2. Check firewall settings (port 5432 should be open)');
      console.error('   3. Verify VPS IP address is correct');
    }
    process.exit(1);
  }
}

setupDatabase();

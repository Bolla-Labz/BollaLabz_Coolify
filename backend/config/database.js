// Last Modified: 2025-11-23 17:30
import pg from 'pg';
import dotenv from 'dotenv';

// Force override existing environment variables
dotenv.config({ override: true });

const { Pool } = pg;

// Database connection configuration
// Railway provides DATABASE_URL, fallback to individual settings for local dev
const poolConfig = process.env.DATABASE_URL
  ? {
      // Railway PostgreSQL connection string
      connectionString: process.env.DATABASE_URL,
      // SSL configuration for Railway (required for production PostgreSQL)
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false // Required for Railway's PostgreSQL
      } : false,
    }
  : {
      // Local development configuration
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'bollalabz',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: false,
    };

// Database connection pool with optimized settings
const pool = new Pool({
  ...poolConfig,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients to keep in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Increased from 2000ms to handle dual-stack failures
  // Performance settings
  statement_timeout: 10000, // Queries timeout after 10 seconds
  query_timeout: 10000, // Query timeout
  // Connection settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

// Performance monitoring thresholds
const SLOW_QUERY_THRESHOLD = 100; // milliseconds
const VERY_SLOW_QUERY_THRESHOLD = 500; // milliseconds

// Query statistics
let queryStats = {
  total: 0,
  slow: 0,
  verySlow: 0,
  avgDuration: 0,
  totalDuration: 0
};

// Query helper function with performance monitoring
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Update statistics
    queryStats.total++;
    queryStats.totalDuration += duration;
    queryStats.avgDuration = queryStats.totalDuration / queryStats.total;

    // Log query performance (sanitized - don't log actual query text in production)
    if (duration > VERY_SLOW_QUERY_THRESHOLD) {
      queryStats.verySlow++;
      console.warn('⚠️ VERY SLOW QUERY:', {
        duration: `${duration}ms`,
        // Only log query text in development
        query: process.env.NODE_ENV === 'development' ? text.substring(0, 100) : '[REDACTED]',
        rows: result.rowCount
      });
    } else if (duration > SLOW_QUERY_THRESHOLD) {
      queryStats.slow++;
      console.log('⏱️ Slow query:', {
        duration: `${duration}ms`,
        query: process.env.NODE_ENV === 'development' ? text.substring(0, 100) : '[REDACTED]',
        rows: result.rowCount
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('✓ Query executed:', {
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }

    return result;
  } catch (error) {
    // Properly format error for logging
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error);

    console.error('❌ Database query error:', {
      message: errorMessage,
      code: error?.code,
      detail: error?.detail,
      // Don't log query text in production (may contain sensitive data)
      query: process.env.NODE_ENV === 'development' ? text.substring(0, 100) : '[REDACTED]'
    });
    throw error;
  }
};

// Get query statistics
export const getQueryStats = () => ({
  ...queryStats,
  avgDuration: Math.round(queryStats.avgDuration),
  slowQueryPercentage: queryStats.total > 0
    ? ((queryStats.slow / queryStats.total) * 100).toFixed(2) + '%'
    : '0%',
  verySlowQueryPercentage: queryStats.total > 0
    ? ((queryStats.verySlow / queryStats.total) * 100).toFixed(2) + '%'
    : '0%'
});

// Reset query statistics
export const resetQueryStats = () => {
  queryStats = {
    total: 0,
    slow: 0,
    verySlow: 0,
    avgDuration: 0,
    totalDuration: 0
  };
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;

// Last Modified: 2025-11-23 17:30
import express from 'express';
import pool, { getQueryStats, resetQueryStats } from '../../config/database.js';

const router = express.Router();

// GET /api/v1/health - Basic health check
router.get('/', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW() as time, version() as pg_version');
    const dbConnected = result.rows.length > 0;

    // Get pool stats
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        serverTime: result.rows[0]?.time,
        version: result.rows[0]?.pg_version?.split(' ')[0] + ' ' + result.rows[0]?.pg_version?.split(' ')[1],
        pool: poolStats
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/v1/health/database - Detailed database performance metrics
router.get('/database', async (req, res) => {
  try {
    // Query statistics from our monitoring
    const queryMetrics = getQueryStats();

    // Database size info
    const dbSizeResult = await pool.query(`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity) as total_connections
    `);

    // Table sizes
    const tableSizeResult = await pool.query(`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    // Index usage statistics
    const indexStatsResult = await pool.query(`
      SELECT
        schemaname || '.' || tablename AS table,
        indexname,
        idx_scan as times_used,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10
    `);

    // Cache hit ratio
    const cacheHitResult = await pool.query(`
      SELECT
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit) as heap_hit,
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
      FROM pg_statio_user_tables
    `);

    res.json({
      success: true,
      data: {
        query_performance: queryMetrics,
        database: dbSizeResult.rows[0],
        connection_pool: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
          maxConnections: pool.options.max,
          minConnections: pool.options.min || 0
        },
        table_sizes: tableSizeResult.rows,
        top_indexes: indexStatsResult.rows,
        cache_performance: {
          hit_ratio: cacheHitResult.rows[0]?.cache_hit_ratio ?
            parseFloat(cacheHitResult.rows[0].cache_hit_ratio).toFixed(2) + '%' : 'N/A'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/v1/health/database/reset-stats - Reset query statistics
router.post('/database/reset-stats', (req, res) => {
  resetQueryStats();
  res.json({
    success: true,
    message: 'Query statistics reset successfully'
  });
});

// GET /api/v1/health/database/slow-queries - Get slow query analysis
router.get('/database/slow-queries', async (req, res) => {
  try {
    // This requires pg_stat_statements extension
    const slowQueriesResult = await pool.query(`
      SELECT
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time,
        rows,
        query
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `).catch(() => {
      // If pg_stat_statements not enabled, return empty
      return { rows: [] };
    });

    if (slowQueriesResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'pg_stat_statements extension not enabled. Enable it for detailed slow query analysis.',
        data: []
      });
    }

    res.json({
      success: true,
      data: slowQueriesResult.rows.map(row => ({
        calls: row.calls,
        avg_time_ms: parseFloat(row.mean_exec_time).toFixed(2),
        max_time_ms: parseFloat(row.max_exec_time).toFixed(2),
        total_time_ms: parseFloat(row.total_exec_time).toFixed(2),
        rows_avg: Math.round(row.rows / row.calls),
        query: row.query.substring(0, 200)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

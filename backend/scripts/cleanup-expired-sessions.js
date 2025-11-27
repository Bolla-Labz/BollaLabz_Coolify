#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Cleanup Expired Sessions Script
 * Run this script periodically (via cron) to remove expired refresh tokens from the database
 */

import pool from '../config/database.js';
import logger from '../config/logger.js';

async function cleanupExpiredSessions() {
  try {
    logger.info('Starting cleanup of expired sessions...');

    const result = await pool.query(
      'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
    );

    const deletedCount = result.rowCount;
    logger.info(`Cleanup completed: ${deletedCount} expired sessions removed`);

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
    throw error;
  }
}

// Run cleanup if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpiredSessions()
    .then((count) => {
      console.log(`✓ Cleanup successful: ${count} sessions removed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Cleanup failed:', error);
      process.exit(1);
    });
}

export default cleanupExpiredSessions;

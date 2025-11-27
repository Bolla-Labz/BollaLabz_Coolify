// Last Modified: 2025-11-23 19:30
import Redis from 'ioredis';
import logger from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false'; // Default to true unless explicitly disabled

let redis = null;

// Only create Redis client if caching is enabled
if (CACHE_ENABLED) {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        // Stop retrying after 3 attempts
        if (times > 3) {
          logger.warn('Redis retry limit reached, disabling cache');
          redis = null;
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true, // Don't connect immediately, wait for explicit connect()
      enableOfflineQueue: false, // Fail fast if Redis is down
    });

    redis.on('connect', () => {
      logger.info('Redis client connected successfully');
    });

    redis.on('ready', () => {
      logger.info('Redis client ready to accept commands');
    });

    redis.on('error', (err) => {
      logger.error('Redis client error:', err.message);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redis.on('reconnecting', () => {
      logger.debug('Redis client reconnecting...');
    });

    // Attempt to connect
    redis.connect().catch((err) => {
      logger.error('Failed to connect to Redis:', err.message);
      logger.warn('Continuing without Redis caching - all cache operations will be skipped');
      redis.quit().catch(() => {}); // Suppress quit errors
      redis = null;
    });
  } catch (err) {
    logger.error('Failed to initialize Redis client:', err.message);
    logger.warn('Continuing without Redis caching');
    redis = null;
  }
} else {
  logger.info('Redis caching disabled via CACHE_ENABLED=false');
}

/**
 * Get the Redis client instance
 * @returns {Redis|null} Redis client or null if disabled/unavailable
 */
export const getRedisClient = () => {
  return redis;
};

/**
 * Check if Redis is available and connected
 * @returns {boolean}
 */
export const isRedisAvailable = () => {
  return redis !== null && redis.status === 'ready';
};

/**
 * Gracefully close Redis connection
 */
export const closeRedis = async () => {
  if (redis) {
    try {
      await redis.quit();
      logger.info('Redis connection closed gracefully');
    } catch (err) {
      logger.error('Error closing Redis connection:', err.message);
    }
  }
};

export default redis;

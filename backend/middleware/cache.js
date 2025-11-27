// Last Modified: 2025-11-23 19:30
import { getRedisClient, isRedisAvailable } from '../config/redis.js';
import logger from '../config/logger.js';

const DEFAULT_TTL = parseInt(process.env.CACHE_DEFAULT_TTL) || 300; // 5 minutes default

/**
 * Generate cache key from user ID and URL
 * @param {string} userId - User ID from JWT token
 * @param {string} url - Request URL
 * @param {object} query - Query parameters (optional)
 * @returns {string} Cache key
 */
const generateCacheKey = (userId, url, query = {}) => {
  const queryString = Object.keys(query).length > 0
    ? `:${JSON.stringify(query)}`
    : '';
  return `cache:user:${userId}:${url}${queryString}`;
};

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 300)
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (ttl = DEFAULT_TTL) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis not available
    if (!isRedisAvailable()) {
      return next();
    }

    // Skip if no user (shouldn't happen with requireAuth, but just in case)
    if (!req.user?.userId) {
      return next();
    }

    const redis = getRedisClient();
    const cacheKey = generateCacheKey(req.user.userId, req.originalUrl, req.query);

    try {
      // Try to get cached data
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`);

        // Parse and return cached response
        const parsedData = JSON.parse(cachedData);

        return res.json({
          ...parsedData,
          _cached: true,
          _cachedAt: new Date().toISOString()
        });
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          redis.setex(cacheKey, ttl, JSON.stringify(data))
            .then(() => {
              logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
            })
            .catch((err) => {
              logger.error(`Cache SET failed for ${cacheKey}:`, err.message);
            });
        }

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (err) {
      logger.error(`Cache middleware error: ${err.message}`);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Invalidate cache for a specific user and pattern
 * @param {string} userId - User ID
 * @param {string} pattern - URL pattern to invalidate (e.g., '/api/v1/contacts*')
 */
export const invalidateCache = async (userId, pattern) => {
  if (!isRedisAvailable()) {
    return;
  }

  const redis = getRedisClient();
  const searchPattern = `cache:user:${userId}:${pattern}`;

  try {
    // Find all keys matching the pattern
    const keys = await redis.keys(searchPattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Cache INVALIDATED: ${keys.length} keys matching ${searchPattern}`);
    } else {
      logger.debug(`Cache INVALIDATE: No keys found for ${searchPattern}`);
    }
  } catch (err) {
    logger.error(`Cache invalidation error for pattern ${searchPattern}:`, err.message);
  }
};

/**
 * Invalidate all cache for a specific user
 * @param {string} userId - User ID
 */
export const invalidateUserCache = async (userId) => {
  if (!isRedisAvailable()) {
    return;
  }

  const redis = getRedisClient();
  const searchPattern = `cache:user:${userId}:*`;

  try {
    const keys = await redis.keys(searchPattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cache CLEARED: ${keys.length} keys for user ${userId}`);
    }
  } catch (err) {
    logger.error(`User cache invalidation error for user ${userId}:`, err.message);
  }
};

/**
 * Clear all cache (use with caution)
 */
export const clearAllCache = async () => {
  if (!isRedisAvailable()) {
    return;
  }

  const redis = getRedisClient();

  try {
    await redis.flushdb();
    logger.info('Cache FLUSHED: All cache cleared');
  } catch (err) {
    logger.error('Cache flush error:', err.message);
  }
};

export default cacheMiddleware;

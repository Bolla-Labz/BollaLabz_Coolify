// Last Modified: 2025-11-23 17:15
/**
 * Cost Control Middleware
 * Enforces daily cost limits per user for external services (Claude, Twilio, ElevenLabs)
 * Prevents runaway costs by checking today's spend before allowing API calls
 */

import pool from '../config/database.js';
import logger from '../config/logger.js';

// Daily cost limits per user (in USD)
const DAILY_COST_LIMITS = {
  claude: 10.00,     // AI chat/conversation
  twilio: 5.00,      // SMS and voice calls
  elevenlabs: 15.00  // Voice synthesis
};

// Map service providers to service types
const SERVICE_PROVIDER_MAP = {
  'anthropic': 'claude',
  'claude': 'claude',
  'twilio': 'twilio',
  'elevenlabs': 'elevenlabs'
};

/**
 * Check today's costs for a specific service
 * @param {number} userId - User ID
 * @param {string} serviceType - Service type (claude, twilio, elevenlabs)
 * @returns {Promise<number>} - Total cost for today
 */
async function getTodayCost(userId, serviceType) {
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(cost_amount), 0) as total_cost
       FROM call_costs
       WHERE user_id = $1
       AND service_type = $2
       AND billing_date >= CURRENT_DATE
       AND billing_date < CURRENT_DATE + INTERVAL '1 day'`,
      [userId, serviceType]
    );

    return parseFloat(result.rows[0].total_cost);
  } catch (error) {
    logger.error('Error fetching today\'s costs', {
      userId,
      serviceType,
      error: error.message
    });
    // Return 0 to allow the request (fail open, but log the error)
    return 0;
  }
}

/**
 * Get all today's costs for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Costs by service type
 */
async function getAllTodayCosts(userId) {
  try {
    const result = await pool.query(
      `SELECT service_type, COALESCE(SUM(cost_amount), 0) as total_cost
       FROM call_costs
       WHERE user_id = $1
       AND billing_date >= CURRENT_DATE
       AND billing_date < CURRENT_DATE + INTERVAL '1 day'
       GROUP BY service_type`,
      [userId]
    );

    const costs = {
      claude: 0,
      twilio: 0,
      elevenlabs: 0
    };

    result.rows.forEach(row => {
      if (costs.hasOwnProperty(row.service_type)) {
        costs[row.service_type] = parseFloat(row.total_cost);
      }
    });

    return costs;
  } catch (error) {
    logger.error('Error fetching all today\'s costs', {
      userId,
      error: error.message
    });
    return { claude: 0, twilio: 0, elevenlabs: 0 };
  }
}

/**
 * Cost control middleware factory
 * @param {string} serviceType - Service type to check (claude, twilio, elevenlabs)
 * @returns {Function} Express middleware
 */
export function costControlMiddleware(serviceType) {
  // Validate service type
  if (!DAILY_COST_LIMITS.hasOwnProperty(serviceType)) {
    throw new Error(`Invalid service type: ${serviceType}. Must be one of: ${Object.keys(DAILY_COST_LIMITS).join(', ')}`);
  }

  return async (req, res, next) => {
    try {
      // Extract user ID from JWT token (set by authenticateJWT middleware)
      const userId = req.user?.userId;

      if (!userId) {
        logger.warn('Cost control middleware: No user ID found in request', {
          path: req.path,
          method: req.method
        });
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User authentication required for cost tracking'
        });
      }

      // Get today's cost for this service
      const todayCost = await getTodayCost(userId, serviceType);
      const costLimit = DAILY_COST_LIMITS[serviceType];

      // Check if limit exceeded
      if (todayCost >= costLimit) {
        logger.warn('Daily cost limit exceeded', {
          userId,
          serviceType,
          todayCost,
          costLimit,
          path: req.path
        });

        return res.status(429).json({
          success: false,
          error: 'Cost limit exceeded',
          message: `Daily cost limit for ${serviceType} exceeded ($${costLimit.toFixed(2)}). Current spend: $${todayCost.toFixed(2)}`,
          data: {
            service: serviceType,
            limit: costLimit,
            current: todayCost,
            remaining: 0,
            resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
          }
        });
      }

      // Add cost tracking info to request object for downstream use
      req.costTracking = {
        userId,
        serviceType,
        currentCost: todayCost,
        limit: costLimit,
        remaining: costLimit - todayCost
      };

      logger.debug('Cost control check passed', {
        userId,
        serviceType,
        todayCost,
        costLimit,
        remaining: costLimit - todayCost
      });

      next();
    } catch (error) {
      logger.error('Cost control middleware error', {
        error: error.message,
        stack: error.stack,
        serviceType
      });

      // Fail open (allow the request) but log the error
      // This prevents cost tracking issues from breaking the application
      next();
    }
  };
}

/**
 * Middleware to get cost summary for current user
 * Useful for dashboard/stats endpoints
 */
export async function getCostSummary(req, res, next) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next();
    }

    const costs = await getAllTodayCosts(userId);

    req.costSummary = {
      today: costs,
      limits: DAILY_COST_LIMITS,
      remaining: {
        claude: Math.max(0, DAILY_COST_LIMITS.claude - costs.claude),
        twilio: Math.max(0, DAILY_COST_LIMITS.twilio - costs.twilio),
        elevenlabs: Math.max(0, DAILY_COST_LIMITS.elevenlabs - costs.elevenlabs)
      }
    };

    next();
  } catch (error) {
    logger.error('Cost summary middleware error', {
      error: error.message,
      stack: error.stack
    });
    next();
  }
}

/**
 * Endpoint to manually record a cost
 * Used by integrations to log costs after API calls
 * @param {number} userId - User ID
 * @param {string} serviceType - Service type
 * @param {number} costAmount - Cost in USD
 * @param {object} metadata - Additional metadata
 */
export async function recordCost(userId, serviceType, costAmount, metadata = {}) {
  try {
    await pool.query(
      `INSERT INTO call_costs (user_id, service_type, cost_amount, service_provider, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, serviceType, costAmount, serviceType, metadata]
    );

    logger.info('Cost recorded', {
      userId,
      serviceType,
      costAmount
    });
  } catch (error) {
    logger.error('Error recording cost', {
      userId,
      serviceType,
      costAmount,
      error: error.message
    });
    throw error;
  }
}

// Export service type constants for use in routes
export const SERVICE_TYPES = {
  CLAUDE: 'claude',
  TWILIO: 'twilio',
  ELEVENLABS: 'elevenlabs'
};

export default costControlMiddleware;

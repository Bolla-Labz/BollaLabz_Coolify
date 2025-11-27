// Last Modified: 2025-11-23 17:30
import express from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { query as dbQuery } from '../../../config/database.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, dateRangeValidators } from '../../../validators/common.js';
import { readLimiter } from '../../../middleware/rateLimiter.js';
import { Call } from '../../../models/index.js';
import { cacheMiddleware } from '../../../middleware/cache.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/v1/analytics/dashboard - Dashboard summary
router.get(
  '/dashboard',
  readLimiter,
  cacheMiddleware(900), // 15 minutes cache
  dateRangeValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (startDate) {
      dateFilter += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    // Get contact stats
    const contactStats = await dbQuery(
      `SELECT
         COUNT(*) as total_contacts,
         COUNT(CASE WHEN last_contact_date IS NOT NULL THEN 1 END) as active_contacts,
         SUM(conversation_count) as total_conversations
       FROM phone_contacts
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // Get message stats (no cost in conversation_messages table)
    const messageStats = await dbQuery(
      `SELECT
         COUNT(*) as total_messages,
         COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_messages,
         COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_messages
       FROM conversation_messages
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // Get call stats - use billing_date and cost_amount
    const callStats = await dbQuery(
      `SELECT
         COUNT(*) as total_calls,
         SUM(cost_amount) as total_call_cost,
         AVG(cost_amount) as avg_cost
       FROM call_costs
       WHERE 1=1 ${dateFilter.replace(/created_at/g, 'billing_date')}`,
      params
    );

    // Get task stats
    const taskStats = await dbQuery(
      `SELECT
         COUNT(*) as total_tasks,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
         COUNT(CASE WHEN scheduled_for < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks
       FROM scheduled_tasks
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // Get workflow stats
    const workflowStats = await dbQuery(
      `SELECT
         COUNT(*) as total_workflows,
         COUNT(CASE WHEN is_active THEN 1 END) as active_workflows,
         SUM(hit_count) as total_hits
       FROM workflow_triggers`,
      []
    );

    res.json({
      success: true,
      data: {
        contacts: contactStats.rows[0],
        messages: messageStats.rows[0],
        calls: callStats.rows[0],
        tasks: taskStats.rows[0],
        workflows: workflowStats.rows[0],
        total_cost: parseFloat(callStats.rows[0].total_call_cost || 0).toFixed(6)
      },
      filters: {
        startDate: startDate || 'all_time',
        endDate: endDate || 'now'
      }
    });
  })
);

// GET /api/v1/analytics/calls - Call analytics
router.get(
  '/calls',
  readLimiter,
  dateRangeValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const analytics = await Call.getCostBreakdown({ startDate, endDate });

    // Get daily breakdown
    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (startDate) {
      dateFilter += ` AND billing_date >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND billing_date <= $${paramCount++}`;
      params.push(endDate);
    }

    const dailyBreakdown = await dbQuery(
      `SELECT
         DATE(billing_date) as date,
         COUNT(*) as calls,
         SUM(cost_amount) as cost
       FROM call_costs
       WHERE 1=1 ${dateFilter}
       GROUP BY DATE(billing_date)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    res.json({
      success: true,
      data: {
        summary: {
          total_calls: parseInt(analytics.total_calls) || 0,
          total_cost: parseFloat(analytics.total_cost) || 0,
          avg_cost_per_call: parseFloat(analytics.avg_cost_per_call) || 0
        },
        daily_breakdown: dailyBreakdown.rows
      },
      filters: {
        startDate: startDate || 'all_time',
        endDate: endDate || 'now'
      }
    });
  })
);

// GET /api/v1/analytics/messages - Message analytics
router.get(
  '/messages',
  readLimiter,
  dateRangeValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (startDate) {
      dateFilter += ` AND timestamp >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND timestamp <= $${paramCount++}`;
      params.push(endDate);
    }

    // Overall stats (no cost column in conversation_messages)
    const overallStats = await dbQuery(
      `SELECT
         COUNT(*) as total_messages,
         COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound,
         COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound
       FROM conversation_messages
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // Daily breakdown (no cost column)
    const dailyBreakdown = await dbQuery(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as messages,
         COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound,
         COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound
       FROM conversation_messages
       WHERE 1=1 ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    // Top contacts by message volume (no cost column)
    const topContacts = await dbQuery(
      `SELECT
         pc.id, pc.contact_name, pc.phone_number,
         COUNT(*) as message_count
       FROM conversation_messages cm
       JOIN phone_contacts pc ON cm.contact_id = pc.id
       WHERE 1=1 ${dateFilter}
       GROUP BY pc.id, pc.contact_name, pc.phone_number
       ORDER BY message_count DESC
       LIMIT 10`,
      params
    );

    res.json({
      success: true,
      data: {
        summary: overallStats.rows[0],
        daily_breakdown: dailyBreakdown.rows,
        top_contacts: topContacts.rows
      },
      filters: {
        startDate: startDate || 'all_time',
        endDate: endDate || 'now'
      }
    });
  })
);

// GET /api/v1/analytics/costs - Cost breakdown
router.get(
  '/costs',
  readLimiter,
  dateRangeValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (startDate) {
      dateFilter += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    // Get message count (no cost tracking for messages)
    const messageCount = await dbQuery(
      `SELECT COUNT(*) as count
       FROM conversation_messages
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // Call costs - use billing_date and cost_amount
    const callCosts = await dbQuery(
      `SELECT
         SUM(cost_amount) as total_cost,
         COUNT(*) as count,
         AVG(cost_amount) as avg_cost
       FROM call_costs
       WHERE 1=1 ${dateFilter.replace(/created_at/g, 'billing_date')}`,
      params
    );

    const totalCost = parseFloat(callCosts.rows[0].total_cost || 0).toFixed(6);

    res.json({
      success: true,
      data: {
        total_cost: parseFloat(totalCost),
        breakdown: {
          messages: {
            total_cost: 0,
            count: parseInt(messageCount.rows[0].count || 0),
            avg_cost: 0,
            note: "Message costs not tracked separately"
          },
          calls: {
            total_cost: parseFloat(callCosts.rows[0].total_cost || 0),
            count: parseInt(callCosts.rows[0].count || 0),
            avg_cost: parseFloat(callCosts.rows[0].avg_cost || 0)
          }
        }
      },
      filters: {
        startDate: startDate || 'all_time',
        endDate: endDate || 'now'
      }
    });
  })
);

// GET /api/v1/analytics/trends - Trend analysis
router.get(
  '/trends',
  readLimiter,
  dateRangeValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (startDate) {
      dateFilter += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    // Contact growth
    const contactGrowth = await dbQuery(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as new_contacts
       FROM phone_contacts
       WHERE 1=1 ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 90`,
      params
    );

    // Task completion rate
    const taskCompletion = await dbQuery(
      `SELECT
         DATE(completed_at) as date,
         COUNT(*) as completed_tasks
       FROM scheduled_tasks
       WHERE completed_at IS NOT NULL ${dateFilter.replace('created_at', 'completed_at')}
       GROUP BY DATE(completed_at)
       ORDER BY date DESC
       LIMIT 90`,
      params
    );

    res.json({
      success: true,
      data: {
        contact_growth: contactGrowth.rows,
        task_completion: taskCompletion.rows
      },
      filters: {
        startDate: startDate || 'all_time',
        endDate: endDate || 'now'
      }
    });
  })
);

export default router;

// Last Modified: 2025-11-23 17:30
/**
 * Cost Tracking Service
 * Track costs for Claude API, Twilio, and other services
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

class CostTrackingService {
  /**
   * Track Claude API cost
   */
  async trackClaudeCost(userId, cost, metadata = {}) {
    try {
      const result = await query(
        `INSERT INTO call_costs
         (user_id, service_provider, service_type, cost_amount, currency, metadata, billing_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          userId,
          'anthropic',
          'ai',
          cost.totalCost,
          'USD',
          JSON.stringify({
            model: metadata.model || 'claude-sonnet-4-5',
            inputTokens: cost.inputTokens,
            outputTokens: cost.outputTokens,
            totalTokens: cost.totalTokens,
            inputCost: cost.inputCost,
            outputCost: cost.outputCost,
            context: metadata.context || 'chat',
            timestamp: new Date().toISOString()
          })
        ]
      );

      logger.info(`Claude API cost tracked: $${cost.totalCost.toFixed(6)} for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to track Claude cost:', error);
      throw error;
    }
  }

  /**
   * Track Twilio SMS cost
   */
  async trackTwilioSMSCost(userId, conversationMessageId, cost, metadata = {}) {
    try {
      const result = await query(
        `INSERT INTO call_costs
         (user_id, conversation_message_id, service_provider, service_type, cost_amount, currency, metadata, billing_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          userId,
          conversationMessageId,
          'twilio',
          'sms',
          Math.abs(parseFloat(cost.amount || 0)),
          cost.currency || 'USD',
          JSON.stringify({
            twilioSid: metadata.twilioSid,
            direction: metadata.direction,
            to: metadata.to,
            from: metadata.from,
            timestamp: new Date().toISOString()
          })
        ]
      );

      logger.info(`Twilio SMS cost tracked: $${cost.amount} for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to track Twilio SMS cost:', error);
      throw error;
    }
  }

  /**
   * Track Twilio voice call cost
   */
  async trackTwilioVoiceCost(userId, conversationMessageId, cost, metadata = {}) {
    try {
      const result = await query(
        `INSERT INTO call_costs
         (user_id, conversation_message_id, service_provider, service_type, cost_amount, currency, metadata, billing_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          userId,
          conversationMessageId,
          'twilio',
          'voice',
          Math.abs(parseFloat(cost.amount || 0)),
          cost.currency || 'USD',
          JSON.stringify({
            twilioSid: metadata.twilioSid,
            direction: metadata.direction,
            duration: metadata.duration,
            to: metadata.to,
            from: metadata.from,
            timestamp: new Date().toISOString()
          })
        ]
      );

      logger.info(`Twilio voice cost tracked: $${cost.amount} for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to track Twilio voice cost:', error);
      throw error;
    }
  }

  /**
   * Get total costs for user
   */
  async getUserCosts(userId, startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT
          service_provider,
          service_type,
          COUNT(*) as transaction_count,
          SUM(cost_amount) as total_cost,
          AVG(cost_amount) as avg_cost,
          MIN(cost_amount) as min_cost,
          MAX(cost_amount) as max_cost,
          currency
        FROM call_costs
        WHERE user_id = $1
      `;

      const params = [userId];
      let paramCount = 2;

      if (startDate) {
        sql += ` AND billing_date >= $${paramCount++}`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND billing_date <= $${paramCount++}`;
        params.push(endDate);
      }

      sql += ' GROUP BY service_provider, service_type, currency ORDER BY total_cost DESC';

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user costs:', error);
      throw error;
    }
  }

  /**
   * Get total costs by service type
   */
  async getCostsByServiceType(userId, serviceType, startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT
          DATE(billing_date) as date,
          COUNT(*) as transaction_count,
          SUM(cost_amount) as total_cost,
          currency
        FROM call_costs
        WHERE user_id = $1 AND service_type = $2
      `;

      const params = [userId, serviceType];
      let paramCount = 3;

      if (startDate) {
        sql += ` AND billing_date >= $${paramCount++}`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND billing_date <= $${paramCount++}`;
        params.push(endDate);
      }

      sql += ' GROUP BY DATE(billing_date), currency ORDER BY date DESC';

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get costs by service type:', error);
      throw error;
    }
  }

  /**
   * Get monthly cost summary
   */
  async getMonthlyCostSummary(userId, year, month) {
    try {
      const sql = `
        SELECT
          service_provider,
          service_type,
          COUNT(*) as transaction_count,
          SUM(cost_amount) as total_cost,
          currency
        FROM call_costs
        WHERE user_id = $1
        AND EXTRACT(YEAR FROM billing_date) = $2
        AND EXTRACT(MONTH FROM billing_date) = $3
        GROUP BY service_provider, service_type, currency
        ORDER BY total_cost DESC
      `;

      const result = await query(sql, [userId, year, month]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get monthly cost summary:', error);
      throw error;
    }
  }
}

// Export singleton instance
const costTrackingService = new CostTrackingService();
export default costTrackingService;

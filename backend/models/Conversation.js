// Last Modified: 2025-11-23 17:30
import { query } from '../config/database.js';

class Conversation {
  // Get all conversations with filters (REQUIRES userId for multi-tenancy)
  // OPTIMIZED: Uses LEFT JOIN to include costs in a single query
  static async findAll({ userId, page = 1, limit = 20, contactId, startDate, endDate, direction, includeCosts = false }) {
    if (!userId) {
      throw new Error('userId is required for conversation queries');
    }

    const offset = (page - 1) * limit;
    const params = [userId];
    let paramCount = 2;

    // Include cost data in main query if requested (prevents N+1)
    let sql = `
      SELECT
        cm.*,
        pc.contact_name,
        pc.phone_number
        ${includeCosts ? ', cc.cost_amount, cc.currency, cc.service_provider' : ''}
      FROM conversation_messages cm
      LEFT JOIN phone_contacts pc ON cm.contact_id = pc.id
      ${includeCosts ? 'LEFT JOIN call_costs cc ON cm.id = cc.conversation_message_id' : ''}
      WHERE cm.user_id = $1
    `;

    if (contactId) {
      sql += ` AND cm.contact_id = $${paramCount++}`;
      params.push(contactId);
    }

    if (startDate) {
      sql += ` AND cm.created_at >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND cm.created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    if (direction) {
      sql += ` AND cm.direction = $${paramCount++}`;
      params.push(direction);
    }

    sql += ` ORDER BY cm.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count with same filters
    let countSql = 'SELECT COUNT(*) FROM conversation_messages cm WHERE cm.user_id = $1';
    const countParams = [userId];
    let countParamIdx = 2;

    if (contactId) {
      countSql += ` AND cm.contact_id = $${countParamIdx++}`;
      countParams.push(contactId);
    }
    if (startDate) {
      countSql += ` AND cm.created_at >= $${countParamIdx++}`;
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ` AND cm.created_at <= $${countParamIdx++}`;
      countParams.push(endDate);
    }
    if (direction) {
      countSql += ` AND cm.direction = $${countParamIdx++}`;
      countParams.push(direction);
    }

    const countResult = await query(countSql, countParams);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  // Find conversation by ID (REQUIRES userId for ownership verification)
  static async findById(id, userId) {
    if (!userId) {
      throw new Error('userId is required for conversation queries');
    }

    const result = await query(
      `SELECT
         cm.*,
         pc.contact_name,
         pc.phone_number,
         pc.contact_email
       FROM conversation_messages cm
       LEFT JOIN phone_contacts pc ON cm.contact_id = pc.id
       WHERE cm.id = $1 AND cm.user_id = $2`,
      [id, userId]
    );
    return result.rows[0];
  }

  // Get conversation by conversation_id (group messages together) (REQUIRES userId)
  static async findByConversationId(conversationId, { userId, page = 1, limit = 50 }) {
    if (!userId) {
      throw new Error('userId is required for conversation queries');
    }

    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
         cm.*,
         pc.contact_name,
         pc.phone_number
       FROM conversation_messages cm
       LEFT JOIN phone_contacts pc ON cm.contact_id = pc.id
       WHERE cm.conversation_id = $1 AND cm.user_id = $2
       ORDER BY cm.created_at ASC
       LIMIT $3 OFFSET $4`,
      [conversationId, userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  // Create new conversation message (REQUIRES userId for ownership)
  static async create({
    userId,
    conversation_id,
    contact_id,
    direction,
    content,
    message_type = 'sms',
    cost = 0,
    metadata = {}
  }) {
    if (!userId) {
      throw new Error('userId is required to create conversation messages');
    }

    const result = await query(
      `INSERT INTO conversation_messages
       (user_id, conversation_id, contact_id, direction, message_content, message_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, conversation_id, contact_id, direction, content, message_type, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  // Update message (REQUIRES userId for ownership verification)
  static async update(id, { userId, content, metadata }) {
    if (!userId) {
      throw new Error('userId is required to update conversation messages');
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (content !== undefined) {
      updates.push(`message_content = $${paramCount++}`);
      values.push(content);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(metadata));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id, userId);

    const result = await query(
      `UPDATE conversation_messages SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Search messages (REQUIRES userId for multi-tenancy)
  static async search({ userId, searchTerm, contactId, page = 1, limit = 20 }) {
    if (!userId) {
      throw new Error('userId is required for message search');
    }

    const offset = (page - 1) * limit;
    const params = [userId, `%${searchTerm}%`];
    let paramCount = 3;

    let sql = `
      SELECT
        cm.*,
        pc.contact_name,
        pc.phone_number
      FROM conversation_messages cm
      LEFT JOIN phone_contacts pc ON cm.contact_id = pc.id
      WHERE cm.user_id = $1 AND cm.message_content ILIKE $2
    `;

    if (contactId) {
      sql += ` AND cm.contact_id = $${paramCount++}`;
      params.push(contactId);
    }

    sql += ` ORDER BY cm.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Count
    let countSql = 'SELECT COUNT(*) FROM conversation_messages WHERE user_id = $1 AND message_content ILIKE $2';
    const countParams = [userId, `%${searchTerm}%`];

    if (contactId) {
      countSql += ' AND contact_id = $3';
      countParams.push(contactId);
    }

    const countResult = await query(countSql, countParams);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  // Delete conversation (REQUIRES userId for ownership verification)
  static async delete(id, userId) {
    if (!userId) {
      throw new Error('userId is required to delete conversation messages');
    }

    const result = await query(
      'DELETE FROM conversation_messages WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
}

export default Conversation;

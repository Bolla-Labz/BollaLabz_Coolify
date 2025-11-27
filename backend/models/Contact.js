// Last Modified: 2025-11-23 17:30
import { query } from '../config/database.js';

class Contact {
  // Get all contacts with pagination and search (REQUIRES userId for multi-tenancy)
  static async findAll({ userId, page = 1, limit = 20, search = '', offset = 0 }) {
    if (!userId) {
      throw new Error('userId is required for contact queries');
    }

    const actualOffset = offset || (page - 1) * limit;

    let sql = `
      SELECT
        id, phone_number, contact_name, contact_email,
        conversation_count, last_contact_date,
        notes, user_id, created_at, updated_at
      FROM phone_contacts
      WHERE user_id = $1
    `;

    const params = [userId];

    if (search) {
      sql += ` AND (contact_name ILIKE $2 OR phone_number ILIKE $2 OR contact_email ILIKE $2)`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, actualOffset);

    const result = await query(sql, params);

    // Get total count for this user
    let countSql = `SELECT COUNT(*) FROM phone_contacts WHERE user_id = $1`;
    const countParams = [userId];

    if (search) {
      countSql += ` AND (contact_name ILIKE $2 OR phone_number ILIKE $2 OR contact_email ILIKE $2)`;
      countParams.push(`%${search}%`);
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

  // Find contact by ID (REQUIRES userId for ownership verification)
  static async findById(id, userId) {
    if (!userId) {
      throw new Error('userId is required for contact queries');
    }

    const result = await query(
      'SELECT id, phone_number, contact_name, contact_email, conversation_count, last_contact_date, notes, user_id, created_at, updated_at FROM phone_contacts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  }

  // Find contact by phone number (REQUIRES userId for ownership verification)
  static async findByPhone(phoneNumber, userId) {
    if (!userId) {
      throw new Error('userId is required for contact queries');
    }

    const result = await query(
      'SELECT id, phone_number, contact_name, contact_email, conversation_count, last_contact_date, notes, user_id, created_at, updated_at FROM phone_contacts WHERE phone_number = $1 AND user_id = $2',
      [phoneNumber, userId]
    );
    return result.rows[0];
  }

  // Create new contact (REQUIRES userId for ownership)
  static async create({ userId, phone_number, contact_name, contact_email, notes = null }) {
    if (!userId) {
      throw new Error('userId is required to create contacts');
    }

    const result = await query(
      `INSERT INTO phone_contacts
       (user_id, phone_number, contact_name, contact_email, notes, conversation_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())
       RETURNING id, phone_number, contact_name, contact_email, notes, user_id, conversation_count, created_at, updated_at`,
      [userId, phone_number, contact_name, contact_email, notes]
    );
    return result.rows[0];
  }

  // Update contact (REQUIRES userId for ownership verification)
  static async update(id, { userId, contact_name, contact_email, notes }) {
    if (!userId) {
      throw new Error('userId is required to update contacts');
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (contact_name !== undefined) {
      updates.push(`contact_name = $${paramCount++}`);
      values.push(contact_name);
    }
    if (contact_email !== undefined) {
      updates.push(`contact_email = $${paramCount++}`);
      values.push(contact_email);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const result = await query(
      `UPDATE phone_contacts SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING id, phone_number, contact_name, contact_email, notes, user_id, conversation_count, created_at, updated_at`,
      values
    );
    return result.rows[0];
  }

  // Delete contact (REQUIRES userId for ownership verification)
  static async delete(id, userId) {
    if (!userId) {
      throw new Error('userId is required to delete contacts');
    }

    const result = await query(
      'DELETE FROM phone_contacts WHERE id = $1 AND user_id = $2 RETURNING id, phone_number, contact_name, contact_email, user_id',
      [id, userId]
    );
    return result.rows[0];
  }

  // Increment conversation count (REQUIRES userId for ownership verification)
  static async incrementConversationCount(id, userId) {
    if (!userId) {
      throw new Error('userId is required to update contacts');
    }

    const result = await query(
      `UPDATE phone_contacts
       SET conversation_count = conversation_count + 1,
           last_contact_date = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, phone_number, contact_name, contact_email, user_id, conversation_count, last_contact_date`,
      [id, userId]
    );
    return result.rows[0];
  }

  // Get contact analytics (REQUIRES userId for ownership verification)
  static async getAnalytics(id, userId) {
    if (!userId) {
      throw new Error('userId is required for contact analytics');
    }

    const conversationStats = await query(
      `SELECT
         COUNT(*) as total_conversations,
         COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_count,
         COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_count,
         0 as total_cost
       FROM conversation_messages
       WHERE contact_id = $1 AND user_id = $2`,
      [id, userId]
    );

    const callStats = await query(
      `SELECT
         COUNT(*) as total_calls,

         SUM(cost_amount) as total_call_cost
       FROM call_costs cc
       JOIN conversation_messages cm ON cm.id = cc.conversation_message_id
       WHERE cm.contact_id = $1 AND cc.user_id = $2`,
      [id, userId]
    );

    return {
      conversations: conversationStats.rows[0],
      calls: callStats.rows[0]
    };
  }

  // Batch get analytics for multiple contacts (OPTIMIZED - prevents N+1 queries)
  static async getBatchAnalytics(contactIds, userId) {
    if (!userId) {
      throw new Error('userId is required for contact analytics');
    }

    if (!contactIds || contactIds.length === 0) {
      return {};
    }

    // Single query to get all conversation stats for multiple contacts
    const conversationStats = await query(
      `SELECT
         contact_id,
         COUNT(*) as total_conversations,
         COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_count,
         COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_count
       FROM conversation_messages
       WHERE contact_id = ANY($1) AND user_id = $2
       GROUP BY contact_id`,
      [contactIds, userId]
    );

    // Single query to get all call stats for multiple contacts
    const callStats = await query(
      `SELECT
         cm.contact_id,
         COUNT(*) as total_calls,
         COALESCE(SUM(cc.cost_amount), 0) as total_call_cost
       FROM call_costs cc
       JOIN conversation_messages cm ON cm.id = cc.conversation_message_id
       WHERE cm.contact_id = ANY($1) AND cc.user_id = $2
       GROUP BY cm.contact_id`,
      [contactIds, userId]
    );

    // Build result map indexed by contact_id
    const analyticsMap = {};

    // Initialize all contacts with zero values
    contactIds.forEach(id => {
      analyticsMap[id] = {
        conversations: {
          total_conversations: '0',
          inbound_count: '0',
          outbound_count: '0'
        },
        calls: {
          total_calls: '0',
          total_call_cost: null
        }
      };
    });

    // Populate conversation stats
    conversationStats.rows.forEach(stat => {
      analyticsMap[stat.contact_id].conversations = {
        total_conversations: stat.total_conversations,
        inbound_count: stat.inbound_count,
        outbound_count: stat.outbound_count
      };
    });

    // Populate call stats
    callStats.rows.forEach(stat => {
      analyticsMap[stat.contact_id].calls = {
        total_calls: stat.total_calls,
        total_call_cost: stat.total_call_cost
      };
    });

    return analyticsMap;
  }

  // Get all contacts with their analytics in a single optimized query (prevents N+1)
  static async findAllWithAnalytics({ userId, page = 1, limit = 20, search = '', offset = 0 }) {
    if (!userId) {
      throw new Error('userId is required for contact queries');
    }

    const actualOffset = offset || (page - 1) * limit;

    let sql = `
      SELECT
        pc.id,
        pc.phone_number,
        pc.contact_name,
        pc.contact_email,
        pc.conversation_count,
        pc.last_contact_date,
        pc.notes,
        pc.user_id,
        pc.created_at,
        pc.updated_at,
        -- Aggregate conversation stats directly
        COUNT(DISTINCT cm.id) as total_messages,
        COUNT(DISTINCT CASE WHEN cm.direction = 'inbound' THEN cm.id END) as inbound_count,
        COUNT(DISTINCT CASE WHEN cm.direction = 'outbound' THEN cm.id END) as outbound_count,
        -- Aggregate call stats directly
        COUNT(DISTINCT cc.id) as total_calls,
        COALESCE(SUM(cc.cost_amount), 0) as total_cost
      FROM phone_contacts pc
      LEFT JOIN conversation_messages cm ON pc.id = cm.contact_id
      LEFT JOIN call_costs cc ON cm.id = cc.conversation_message_id
      WHERE pc.user_id = $1
    `;

    const params = [userId];

    if (search) {
      sql += ` AND (pc.contact_name ILIKE $2 OR pc.phone_number ILIKE $2 OR pc.contact_email ILIKE $2)`;
      params.push(`%${search}%`);
    }

    sql += `
      GROUP BY pc.id, pc.phone_number, pc.contact_name, pc.contact_email,
               pc.conversation_count, pc.last_contact_date, pc.notes,
               pc.user_id, pc.created_at, pc.updated_at
      ORDER BY pc.updated_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
    params.push(limit, actualOffset);

    const result = await query(sql, params);

    // Get total count for this user
    let countSql = `SELECT COUNT(*) FROM phone_contacts WHERE user_id = $1`;
    const countParams = [userId];

    if (search) {
      countSql += ` AND (contact_name ILIKE $2 OR phone_number ILIKE $2 OR contact_email ILIKE $2)`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);

    // Transform results to include analytics
    const contactsWithAnalytics = result.rows.map(row => ({
      id: row.id,
      phone_number: row.phone_number,
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      conversation_count: row.conversation_count,
      last_contact_date: row.last_contact_date,
      notes: row.notes,
      user_id: row.user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      analytics: {
        conversations: {
          total_conversations: row.total_messages,
          inbound_count: row.inbound_count,
          outbound_count: row.outbound_count
        },
        calls: {
          total_calls: row.total_calls,
          total_call_cost: row.total_cost
        }
      }
    }));

    return {
      data: contactsWithAnalytics,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }
}

export default Contact;

// Last Modified: 2025-11-23 17:30
import { query } from '../config/database.js';

class ChatConversation {
  /**
   * Get or create conversation for user
   */
  static async getOrCreate(userId) {
    if (!userId) {
      throw new Error('userId is required for chat conversations');
    }

    // Try to get existing conversation
    let result = await query(
      'SELECT * FROM chat_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create new conversation
      result = await query(
        `INSERT INTO chat_conversations (user_id, conversation_data, message_count, created_at, updated_at)
         VALUES ($1, $2, 0, NOW(), NOW())
         RETURNING *`,
        [userId, JSON.stringify({ messages: [], metadata: {} })]
      );
    }

    return result.rows[0];
  }

  /**
   * Update conversation data
   */
  static async update(userId, conversationData) {
    if (!userId) {
      throw new Error('userId is required to update chat conversations');
    }

    const messageCount = conversationData.messages?.length || 0;

    const result = await query(
      `UPDATE chat_conversations
       SET conversation_data = $1,
           message_count = $2,
           last_message_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      [JSON.stringify(conversationData), messageCount, userId]
    );

    if (result.rows.length === 0) {
      // If no existing conversation, create one
      return await query(
        `INSERT INTO chat_conversations (user_id, conversation_data, message_count, last_message_at, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW(), NOW())
         RETURNING *`,
        [userId, JSON.stringify(conversationData), messageCount]
      );
    }

    return result.rows[0];
  }

  /**
   * Clear conversation for user
   */
  static async clear(userId) {
    if (!userId) {
      throw new Error('userId is required to clear chat conversations');
    }

    const result = await query(
      `UPDATE chat_conversations
       SET conversation_data = $1,
           message_count = 0,
           updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [JSON.stringify({ messages: [], metadata: {} }), userId]
    );

    return result.rows[0];
  }

  /**
   * Get conversation by user ID
   */
  static async findByUserId(userId) {
    if (!userId) {
      throw new Error('userId is required for chat conversations');
    }

    const result = await query(
      'SELECT * FROM chat_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );

    return result.rows[0];
  }

  /**
   * Delete conversation
   */
  static async delete(userId) {
    if (!userId) {
      throw new Error('userId is required to delete chat conversations');
    }

    const result = await query(
      'DELETE FROM chat_conversations WHERE user_id = $1 RETURNING *',
      [userId]
    );

    return result.rows[0];
  }

  /**
   * Get all conversations (admin)
   */
  static async findAll({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT cc.*, u.email, u.full_name
       FROM chat_conversations cc
       JOIN users u ON cc.user_id = u.id
       ORDER BY cc.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM chat_conversations');

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
}

export default ChatConversation;

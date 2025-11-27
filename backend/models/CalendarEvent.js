// Last Modified: 2025-11-23 17:30
import { query } from '../config/database.js';

class CalendarEvent {
  // Get all calendar events with filters
  static async findAll({ userId, page = 1, limit = 20, startDate, endDate }) {
    if (!userId) {
      throw new Error('userId is required for calendar event queries');
    }

    const offset = (page - 1) * limit;
    const params = [userId];
    let paramCount = 2;

    let sql = `
      SELECT
        id, event_title as title, event_description as description,
        event_type as type, start_time, end_time,
        location, attendees, reminder_minutes,
        is_all_day, recurrence_rule, external_id,
        metadata, created_at, updated_at
      FROM calendar_events
      WHERE user_id = $1
    `;

    if (startDate) {
      sql += ` AND start_time >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND end_time <= $${paramCount++}`;
      params.push(endDate);
    }

    sql += ` ORDER BY start_time ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Count
    let countSql = 'SELECT COUNT(*) FROM calendar_events WHERE user_id = $1';
    const countParams = [userId];
    let countIdx = 2;

    if (startDate) {
      countSql += ` AND start_time >= $${countIdx++}`;
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ` AND end_time <= $${countIdx++}`;
      countParams.push(endDate);
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

  // Find event by ID
  static async findById(id, userId) {
    if (!userId) {
      throw new Error('userId is required for calendar event queries');
    }

    const result = await query(
      `SELECT id, event_title as title, event_description as description,
              event_type as type, start_time, end_time,
              location, attendees, reminder_minutes,
              is_all_day, recurrence_rule, external_id,
              metadata, created_at, updated_at
       FROM calendar_events
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0];
  }

  // Create new event
  static async create({ userId, title, description, type, startTime, endTime, location, attendees, reminderMinutes, isAllDay, recurrenceRule, metadata = {} }) {
    if (!userId) {
      throw new Error('userId is required to create calendar events');
    }

    const result = await query(
      `INSERT INTO calendar_events
       (user_id, event_title, event_description, event_type, start_time, end_time,
        location, attendees, reminder_minutes, is_all_day, recurrence_rule,
        metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING id, event_title as title, event_description as description,
                 event_type as type, start_time, end_time,
                 location, attendees, reminder_minutes,
                 is_all_day, recurrence_rule, metadata,
                 created_at, updated_at`,
      [
        userId,
        title,
        description || null,
        type || null,
        startTime,
        endTime || null,
        location || null,
        attendees ? JSON.stringify(attendees) : null,
        reminderMinutes || null,
        isAllDay || false,
        recurrenceRule || null,
        JSON.stringify(metadata)
      ]
    );
    return result.rows[0];
  }

  // Update event
  static async update(id, userId, updates) {
    if (!userId) {
      throw new Error('userId is required to update calendar events');
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMapping = {
      title: 'event_title',
      description: 'event_description',
      type: 'event_type',
      startTime: 'start_time',
      endTime: 'end_time',
      location: 'location',
      attendees: 'attendees',
      reminderMinutes: 'reminder_minutes',
      isAllDay: 'is_all_day',
      recurrenceRule: 'recurrence_rule',
      metadata: 'metadata'
    };

    for (const [apiField, dbField] of Object.entries(fieldMapping)) {
      if (updates[apiField] !== undefined) {
        fields.push(`${dbField} = $${paramCount++}`);
        if (apiField === 'metadata' || apiField === 'attendees') {
          values.push(JSON.stringify(updates[apiField]));
        } else {
          values.push(updates[apiField]);
        }
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, userId);

    const result = await query(
      `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING id, event_title as title, event_description as description,
                 event_type as type, start_time, end_time,
                 location, attendees, reminder_minutes,
                 is_all_day, recurrence_rule, metadata,
                 created_at, updated_at`,
      values
    );
    return result.rows[0];
  }

  // Delete event
  static async delete(id, userId) {
    if (!userId) {
      throw new Error('userId is required to delete calendar events');
    }

    const result = await query(
      'DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  // Get upcoming events
  static async getUpcoming(userId, limit = 10) {
    if (!userId) {
      throw new Error('userId is required for calendar event queries');
    }

    const result = await query(
      `SELECT id, event_title as title, event_description as description,
              event_type as type, start_time, end_time,
              location, attendees, reminder_minutes,
              is_all_day, recurrence_rule, metadata,
              created_at, updated_at
       FROM calendar_events
       WHERE user_id = $1 AND start_time >= NOW()
       ORDER BY start_time ASC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // Get events for a specific date range
  static async getByDateRange(userId, startDate, endDate) {
    if (!userId) {
      throw new Error('userId is required for calendar event queries');
    }

    const result = await query(
      `SELECT id, event_title as title, event_description as description,
              event_type as type, start_time, end_time,
              location, attendees, reminder_minutes,
              is_all_day, recurrence_rule, metadata,
              created_at, updated_at
       FROM calendar_events
       WHERE user_id = $1
       AND start_time >= $2
       AND end_time <= $3
       ORDER BY start_time ASC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }
}

export default CalendarEvent;

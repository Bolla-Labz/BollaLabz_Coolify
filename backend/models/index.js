// Last Modified: 2025-11-23 17:30
// Export all models
export { default as Contact } from './Contact.js';
export { default as Conversation } from './Conversation.js';
export { default as Task } from './Task.js';

// Quick model stubs for remaining tables - to be expanded
export class Call {
  static async findAll({ page = 1, limit = 20, contactId, startDate, endDate }) {
    const { query } = await import('../config/database.js');
    const offset = (page - 1) * limit;
    const params = [];
    let sql = `SELECT cc.*, cm.contact_id, pc.contact_name
               FROM call_costs cc
               LEFT JOIN conversation_messages cm ON cc.conversation_message_id = cm.id
               LEFT JOIN phone_contacts pc ON cm.contact_id = pc.id
               WHERE 1=1`;
    let paramCount = 1;

    if (contactId) {
      sql += ` AND cm.contact_id = $${paramCount++}`;
      params.push(contactId);
    }
    if (startDate) {
      sql += ` AND cc.billing_date >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND cc.billing_date <= $${paramCount++}`;
      params.push(endDate);
    }

    sql += ` ORDER BY cc.billing_date DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM call_costs', []);

    return {
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  static async findById(id) {
    const { query } = await import('../config/database.js');
    const result = await query('SELECT * FROM call_costs WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ call_sid, conversation_message_id, duration, cost, service_type = 'voice', metadata = {} }) {
    const { query } = await import('../config/database.js');
    const result = await query(
      `INSERT INTO call_costs (conversation_message_id, service_type, cost_amount, metadata, billing_date, created_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [conversation_message_id, service_type, cost, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  static async getCostBreakdown({ startDate, endDate }) {
    const { query } = await import('../config/database.js');
    let sql = `SELECT
                 SUM(cost_amount) as total_cost,
                 COUNT(*) as total_calls,
                 AVG(cost_amount) as avg_cost_per_call
               FROM call_costs WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      sql += ` AND billing_date >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND billing_date <= $${paramCount++}`;
      params.push(endDate);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }
}

export class Workflow {
  static async findAll({ page = 1, limit = 20 }) {
    const { query } = await import('../config/database.js');
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM workflow_triggers ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*) FROM workflow_triggers', []);

    return {
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  static async findById(id) {
    const { query } = await import('../config/database.js');
    const result = await query('SELECT * FROM workflow_triggers WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ name, trigger_type, webhook_url, conditions = {}, actions = {}, metadata = {} }) {
    const { query } = await import('../config/database.js');
    // Map 'name' parameter to 'trigger_name' column
    const triggerName = name;
    const result = await query(
      `INSERT INTO workflow_triggers
       (trigger_name, trigger_type, webhook_url, conditions, actions, hit_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW()) RETURNING *`,
      [triggerName, trigger_type, webhook_url, JSON.stringify(conditions), JSON.stringify(actions)]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const { query } = await import('../config/database.js');
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMapping = { 'name': 'trigger_name' };
    const allowed = ['name', 'trigger_type', 'webhook_url', 'conditions', 'actions', 'is_active'];
    for (const field of allowed) {
      if (updates[field] !== undefined) {
        const dbField = fieldMapping[field] || field;
        fields.push(`${dbField} = $${paramCount++}`);
        values.push(['conditions', 'actions'].includes(field) ? JSON.stringify(updates[field]) : updates[field]);
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE workflow_triggers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const { query } = await import('../config/database.js');
    const result = await query('DELETE FROM workflow_triggers WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async incrementHitCount(id) {
    const { query } = await import('../config/database.js');
    const result = await query(
      `UPDATE workflow_triggers SET hit_count = hit_count + 1, last_triggered = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async getStats(id) {
    const { query } = await import('../config/database.js');
    const result = await query(
      'SELECT hit_count, last_triggered, created_at FROM workflow_triggers WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
}

export class Person {
  static async findAll({ page = 1, limit = 20, search = '' }) {
    const { query } = await import('../config/database.js');
    const offset = (page - 1) * limit;
    const params = [];
    let sql = 'SELECT * FROM people WHERE 1=1';
    let paramCount = 1;

    if (search) {
      sql += ` AND full_name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    sql += ` ORDER BY updated_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countSql = search ? 'SELECT COUNT(*) FROM people WHERE full_name ILIKE $1' : 'SELECT COUNT(*) FROM people';
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await query(countSql, countParams);

    return {
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  static async findById(id) {
    const { query } = await import('../config/database.js');
    const result = await query('SELECT * FROM people WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ full_name, contact_id, company, job_title, relationship_type, notes = '', tags = [], preferences = {} }) {
    const { query } = await import('../config/database.js');
    const result = await query(
      `INSERT INTO people (full_name, contact_id, company, job_title, relationship_type, tags, preferences, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [full_name, contact_id, company, job_title, relationship_type, tags, JSON.stringify(preferences)]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const { query } = await import('../config/database.js');
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowed = ['full_name', 'contact_id', 'company', 'job_title', 'relationship_type', 'tags', 'preferences', 'notes'];
    for (const field of allowed) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramCount++}`);
        values.push(['tags', 'preferences'].includes(field) ? JSON.stringify(updates[field]) : updates[field]);
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE people SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const { query } = await import('../config/database.js');
    const result = await query('DELETE FROM people WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

export class CalendarEvent {
  static async findAll({ page = 1, limit = 20, startDate, endDate }) {
    const { query } = await import('../config/database.js');
    const offset = (page - 1) * limit;
    const params = [];
    let sql = 'SELECT * FROM calendar_events WHERE 1=1';
    let paramCount = 1;

    if (startDate) {
      sql += ` AND start_time >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND end_time <= $${paramCount++}`;
      params.push(endDate);
    }

    sql += ` ORDER BY start_time ASC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM calendar_events', []);

    return {
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  static async findById(id) {
    const { query } = await import('../config/database.js');
    const result = await query('SELECT * FROM calendar_events WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ title, description, start_time, end_time, location, attendees = [], metadata = {} }) {
    const { query } = await import('../config/database.js');
    const result = await query(
      `INSERT INTO calendar_events (event_title, event_description, start_time, end_time, location, attendees, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [title, description, start_time, end_time, location, JSON.stringify(attendees), JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const { query } = await import('../config/database.js');
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Map API field names to database column names
    const fieldMap = { "title": "event_title", "description": "event_description" };

    const allowed = ['title', 'description', 'start_time', 'end_time', 'location', 'attendees', 'metadata'];
    for (const field of allowed) {
      if (updates[field] !== undefined) {
        const dbField = fieldMap[field] || field;
        fields.push(`${dbField} = $${paramCount++}`);
        values.push(['attendees', 'metadata'].includes(field) ? JSON.stringify(updates[field]) : updates[field]);
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE calendar_events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const { query } = await import('../config/database.js');
    const result = await query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getUpcoming({ limit = 10 }) {
    const { query } = await import('../config/database.js');
    const result = await query(
      `SELECT * FROM calendar_events WHERE start_time > NOW() ORDER BY start_time ASC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async getToday() {
    const { query } = await import('../config/database.js');
    const result = await query(
      `SELECT * FROM calendar_events
       WHERE DATE(start_time) = CURRENT_DATE
       ORDER BY start_time ASC`,
      []
    );
    return result.rows;
  }
}

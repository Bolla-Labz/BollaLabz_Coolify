// Last Modified: 2025-11-23 17:30
import { query, transaction } from '../config/database.js';

class Task {
  // Get all tasks with filters
  static async findAll({ userId, page = 1, limit = 20, status, priority, assignee }) {
    const offset = (page - 1) * limit;
    const params = [];
    let paramCount = 1;

    let sql = `
      SELECT
        id, task_name as title, task_description as description,
        status, priority, assigned_to as assignee,
        scheduled_for as due_date, depends_on as dependencies,
        metadata, created_at, updated_at, completed_at
      FROM scheduled_tasks
      WHERE 1=1
    `;

    // Add user_id filter if provided (for multi-tenancy)
    if (userId) {
      sql += ` AND (user_id = $${paramCount++} OR user_id IS NULL)`;
      params.push(userId);
    }

    if (status) {
      sql += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    if (priority) {
      sql += ` AND priority = $${paramCount++}`;
      params.push(priority);
    }

    if (assignee) {
      sql += ` AND assigned_to = $${paramCount++}`;
      params.push(assignee);
    }

    sql += ` ORDER BY
      priority ASC,
      scheduled_for ASC NULLS LAST
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Count
    let countSql = 'SELECT COUNT(*) FROM scheduled_tasks WHERE 1=1';
    const countParams = [];
    let countIdx = 1;

    if (status) {
      countSql += ` AND status = $${countIdx++}`;
      countParams.push(status);
    }
    if (priority) {
      countSql += ` AND priority = $${countIdx++}`;
      countParams.push(priority);
    }
    if (assignee) {
      countSql += ` AND assigned_to = $${countIdx++}`;
      countParams.push(assignee);
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

  // Find task by ID
  static async findById(id) {
    const result = await query('SELECT * FROM scheduled_tasks WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Create new task
  static async create({ userId, title, description, status = 'pending', priority = 3, assignee, due_date, dependencies = [], metadata = {} }) {
    const result = await query(
      `INSERT INTO scheduled_tasks
       (user_id, task_name, task_description, status, priority, assigned_to, scheduled_for, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, task_name as title, task_description as description, status, priority,
                 assigned_to as assignee, scheduled_for as due_date, metadata,
                 created_at, updated_at, completed_at`,
      [userId, title, description, status, priority, assignee, due_date, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  // Update task
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMapping = {
      title: 'task_name',
      description: 'task_description',
      status: 'status',
      priority: 'priority',
      assignee: 'assigned_to',
      due_date: 'scheduled_for',
      dependencies: 'depends_on',
      metadata: 'metadata'
    };

    for (const [apiField, dbField] of Object.entries(fieldMapping)) {
      if (updates[apiField] !== undefined) {
        fields.push(`${dbField} = $${paramCount++}`);
        values.push(
          apiField === 'metadata'
            ? JSON.stringify(updates[apiField])
            : updates[apiField]
        );
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Auto-set completed_at if status is completed
    if (updates.status === 'completed') {
      fields.push(`completed_at = NOW()`);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE scheduled_tasks SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, task_name as title, task_description as description, status, priority,
                 assigned_to as assignee, scheduled_for as due_date, metadata,
                 created_at, updated_at, completed_at`,
      values
    );
    return result.rows[0];
  }

  // Delete task
  static async delete(id) {
    const result = await query(
      'DELETE FROM scheduled_tasks WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Get overdue tasks
  static async getOverdue() {
    const result = await query(
      `SELECT id, task_name as title, task_description as description, status, priority,
              assigned_to as assignee, scheduled_for as due_date, metadata,
              created_at, updated_at, completed_at
       FROM scheduled_tasks
       WHERE status != 'completed'
       AND scheduled_for < NOW()
       ORDER BY scheduled_for ASC`,
      []
    );
    return result.rows;
  }

  // Get today's tasks
  static async getToday() {
    const result = await query(
      `SELECT id, task_name as title, task_description as description, status, priority,
              assigned_to as assignee, scheduled_for as due_date, metadata,
              created_at, updated_at, completed_at
       FROM scheduled_tasks
       WHERE status != 'completed'
       AND DATE(scheduled_for) = CURRENT_DATE
       ORDER BY priority, scheduled_for ASC`,
      []
    );
    return result.rows;
  }

  // Add dependency (note: schema uses single depends_on, not array)
  static async addDependency(taskId, dependencyId) {
    const result = await query(
      `UPDATE scheduled_tasks SET depends_on = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, task_name as title, task_description as description, status, priority,
                 assigned_to as assignee, scheduled_for as due_date, depends_on as dependencies,
                 metadata, created_at, updated_at, completed_at`,
      [dependencyId, taskId]
    );
    if (result.rows.length === 0) {
      throw new Error('Task not found');
    }
    return result.rows[0];
  }

  // Remove dependency
  static async removeDependency(taskId, dependencyId) {
    const result = await query(
      `UPDATE scheduled_tasks SET depends_on = NULL, updated_at = NOW() WHERE id = $1 AND depends_on = $2
       RETURNING id, task_name as title, task_description as description, status, priority,
                 assigned_to as assignee, scheduled_for as due_date, depends_on as dependencies,
                 metadata, created_at, updated_at, completed_at`,
      [taskId, dependencyId]
    );
    if (result.rows.length === 0) {
      throw new Error('Task not found or dependency does not match');
    }
    return result.rows[0];
  }
}

export default Task;

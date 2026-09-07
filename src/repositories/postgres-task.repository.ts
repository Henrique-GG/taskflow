import type { Pool } from 'pg';
import type { Task } from '../domain/task.js';
import type { TaskFilter, TaskRepository } from './task.repository.js';

interface TaskRow {
  id: string;
  title: string;
  subject: string;
  due_date: Date | string;
  priority: Task['priority'];
  status: Task['status'];
  created_at: Date;
  completed_at: Date | null;
}

function toIsoDate(value: Date | string): string {
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    dueDate: toIsoDate(row.due_date),
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}

export class PostgresTaskRepository implements TaskRepository {
  constructor(private readonly pool: Pool) {}

  async list(filter: TaskFilter = {}): Promise<Task[]> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filter.status) {
      params.push(filter.status);
      where.push(`status = $${params.length}`);
    }
    if (filter.subject) {
      params.push(filter.subject);
      where.push(`lower(subject) = lower($${params.length})`);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await this.pool.query<TaskRow>(
      `SELECT * FROM tasks ${clause} ORDER BY due_date ASC, created_at ASC`,
      params
    );
    return result.rows.map(toTask);
  }

  async findById(id: string): Promise<Task | null> {
    const result = await this.pool.query<TaskRow>('SELECT * FROM tasks WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? toTask(row) : null;
  }

  async save(task: Task): Promise<Task> {
    const result = await this.pool.query<TaskRow>(
      `INSERT INTO tasks (id, title, subject, due_date, priority, status, created_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         subject = EXCLUDED.subject,
         due_date = EXCLUDED.due_date,
         priority = EXCLUDED.priority,
         status = EXCLUDED.status,
         completed_at = EXCLUDED.completed_at
       RETURNING *`,
      [
        task.id,
        task.title,
        task.subject,
        task.dueDate,
        task.priority,
        task.status,
        task.createdAt,
        task.completedAt,
      ]
    );
    return toTask(result.rows[0] as TaskRow);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

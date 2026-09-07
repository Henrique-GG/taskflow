import type { Task } from '../domain/task.js';
import type { TaskFilter, TaskRepository } from './task.repository.js';

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  async list(filter: TaskFilter = {}): Promise<Task[]> {
    return [...this.tasks.values()].filter((task) => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.subject && task.subject.toLowerCase() !== filter.subject.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async save(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.clear();
  }
}

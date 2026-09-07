import { randomUUID } from 'node:crypto';
import {
  DomainError,
  completeTask,
  createTask,
  daysUntilDue,
  isOverdue,
  normalizeDueDate,
  normalizeSubject,
  normalizeTitle,
  reopenTask,
  sortByUrgency,
  type Task,
} from '../domain/task.js';
import type { CreateTaskDTO, UpdateTaskDTO } from '../domain/task.schema.js';
import type { TaskFilter, TaskRepository } from '../repositories/task.repository.js';

export interface TaskView extends Task {
  overdue: boolean;
  daysLeft: number;
}

export interface Summary {
  total: number;
  pendentes: number;
  concluidas: number;
  atrasadas: number;
}

export interface Clock {
  now(): Date;
}

const systemClock: Clock = { now: () => new Date() };

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly clock: Clock = systemClock,
    private readonly idFactory: () => string = randomUUID
  ) {}

  private decorate(task: Task): TaskView {
    const now = this.clock.now();
    return { ...task, overdue: isOverdue(task, now), daysLeft: daysUntilDue(task, now) };
  }

  private async require(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) {
      throw new DomainError('Tarefa nao encontrada.', 404);
    }
    return task;
  }

  async list(filter: TaskFilter = {}): Promise<TaskView[]> {
    const tasks = await this.repository.list(filter);
    return sortByUrgency(tasks, this.clock.now()).map((task) => this.decorate(task));
  }

  async get(id: string): Promise<TaskView> {
    return this.decorate(await this.require(id));
  }

  async create(input: CreateTaskDTO): Promise<TaskView> {
    const task = createTask(input, this.idFactory(), this.clock.now());
    return this.decorate(await this.repository.save(task));
  }

  async update(id: string, input: UpdateTaskDTO): Promise<TaskView> {
    const current = await this.require(id);
    const updated: Task = {
      ...current,
      ...(input.title !== undefined ? { title: normalizeTitle(input.title) } : {}),
      ...(input.subject !== undefined ? { subject: normalizeSubject(input.subject) } : {}),
      ...(input.dueDate !== undefined ? { dueDate: normalizeDueDate(input.dueDate) } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
    };
    return this.decorate(await this.repository.save(updated));
  }

  async complete(id: string): Promise<TaskView> {
    const task = completeTask(await this.require(id), this.clock.now());
    return this.decorate(await this.repository.save(task));
  }

  async reopen(id: string): Promise<TaskView> {
    const task = reopenTask(await this.require(id));
    return this.decorate(await this.repository.save(task));
  }

  async remove(id: string): Promise<void> {
    await this.require(id);
    await this.repository.delete(id);
  }

  async summary(): Promise<Summary> {
    const now = this.clock.now();
    const tasks = await this.repository.list();
    return {
      total: tasks.length,
      pendentes: tasks.filter((task) => task.status !== 'concluida').length,
      concluidas: tasks.filter((task) => task.status === 'concluida').length,
      atrasadas: tasks.filter((task) => isOverdue(task, now)).length,
    };
  }
}

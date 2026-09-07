import type { Task } from '../domain/task.js';

export interface TaskFilter {
  status?: Task['status'];
  subject?: string;
}

/**
 * Porta de persistencia. As implementacoes (memoria e Postgres) sao
 * intercambiaveis, o que permite testar o dominio sem subir banco.
 */
export interface TaskRepository {
  list(filter?: TaskFilter): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  save(task: Task): Promise<Task>;
  delete(id: string): Promise<boolean>;
}

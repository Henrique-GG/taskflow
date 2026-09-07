export const PRIORITIES = ['baixa', 'media', 'alta', 'urgente'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['pendente', 'fazendo', 'concluida'] as const;
export type Status = (typeof STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO 8601 (YYYY-MM-DD)
  priority: Priority;
  status: Status;
  createdAt: string;
  completedAt: string | null;
}

export interface NewTaskInput {
  title: string;
  subject: string;
  dueDate: string;
  priority?: Priority;
}

/** Erro de regra de negocio (mapeado para HTTP 4xx nas rotas). */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly status: number = 422
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgente: 4,
  alta: 3,
  media: 2,
  baixa: 1,
};

export function priorityWeight(priority: Priority): number {
  return PRIORITY_WEIGHT[priority];
}

export function normalizeTitle(raw: string): string {
  const title = raw.trim().replace(/\s+/g, ' ');
  if (title.length < 3) {
    throw new DomainError('O titulo precisa ter pelo menos 3 caracteres.');
  }
  if (title.length > 120) {
    throw new DomainError('O titulo pode ter no maximo 120 caracteres.');
  }
  return title;
}

export function normalizeSubject(raw: string): string {
  const subject = raw.trim().replace(/\s+/g, ' ');
  if (subject.length === 0) {
    throw new DomainError('Informe a materia da tarefa.');
  }
  return subject;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDueDate(raw: string): string {
  if (!ISO_DATE.test(raw)) {
    throw new DomainError('A data de entrega deve estar no formato AAAA-MM-DD.');
  }
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError('Data de entrega invalida.');
  }
  // Rejeita datas que "viram" o mes, ex: 2026-02-31
  if (parsed.toISOString().slice(0, 10) !== raw) {
    throw new DomainError('Data de entrega invalida.');
  }
  return raw;
}

/** Uma tarefa esta atrasada quando o prazo passou e ela nao foi concluida. */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.status === 'concluida') return false;
  const deadline = new Date(`${task.dueDate}T23:59:59.999Z`);
  return deadline.getTime() < now.getTime();
}

/** Dias restantes ate o prazo (negativo quando ja passou). */
export function daysUntilDue(task: Task, now: Date = new Date()): number {
  const deadline = Date.parse(`${task.dueDate}T00:00:00.000Z`);
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  return Math.round((deadline - today) / 86_400_000);
}

/**
 * Ordem de trabalho: atrasadas primeiro, depois prazo mais proximo,
 * e como criterio de desempate a prioridade mais alta.
 */
export function compareByUrgency(a: Task, b: Task, now: Date = new Date()): number {
  const overdueA = isOverdue(a, now) ? 0 : 1;
  const overdueB = isOverdue(b, now) ? 0 : 1;
  if (overdueA !== overdueB) return overdueA - overdueB;
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  return priorityWeight(b.priority) - priorityWeight(a.priority);
}

export function sortByUrgency(tasks: Task[], now: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => compareByUrgency(a, b, now));
}

export function createTask(input: NewTaskInput, id: string, now: Date = new Date()): Task {
  return {
    id,
    title: normalizeTitle(input.title),
    subject: normalizeSubject(input.subject),
    dueDate: normalizeDueDate(input.dueDate),
    priority: input.priority ?? 'media',
    status: 'pendente',
    createdAt: now.toISOString(),
    completedAt: null,
  };
}

export function completeTask(task: Task, now: Date = new Date()): Task {
  if (task.status === 'concluida') {
    throw new DomainError('Esta tarefa ja foi concluida.', 409);
  }
  return { ...task, status: 'concluida', completedAt: now.toISOString() };
}

export function reopenTask(task: Task): Task {
  if (task.status !== 'concluida') {
    throw new DomainError('So e possivel reabrir tarefas concluidas.', 409);
  }
  return { ...task, status: 'pendente', completedAt: null };
}

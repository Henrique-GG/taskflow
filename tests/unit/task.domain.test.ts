import { describe, expect, it } from 'vitest';
import {
  DomainError,
  completeTask,
  compareByUrgency,
  createTask,
  daysUntilDue,
  isOverdue,
  normalizeDueDate,
  normalizeTitle,
  priorityWeight,
  reopenTask,
  sortByUrgency,
  type Task,
} from '../../src/domain/task.js';

const NOW = new Date('2026-09-07T12:00:00.000Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Entregar A1 de DevOps',
    subject: 'Integracao DevOps',
    dueDate: '2026-09-09',
    priority: 'alta',
    status: 'pendente',
    createdAt: NOW.toISOString(),
    completedAt: null,
    ...overrides,
  };
}

describe('normalizeTitle', () => {
  it('remove espacos duplicados e das pontas', () => {
    expect(normalizeTitle('  Estudar    grafos ')).toBe('Estudar grafos');
  });

  it('rejeita titulo curto demais', () => {
    expect(() => normalizeTitle('ab')).toThrow(DomainError);
  });

  it('rejeita titulo com mais de 120 caracteres', () => {
    expect(() => normalizeTitle('a'.repeat(121))).toThrow(/120 caracteres/);
  });
});

describe('normalizeDueDate', () => {
  it('aceita data ISO valida', () => {
    expect(normalizeDueDate('2026-09-09')).toBe('2026-09-09');
  });

  it('rejeita formato diferente de AAAA-MM-DD', () => {
    expect(() => normalizeDueDate('09/09/2026')).toThrow(DomainError);
  });

  it('rejeita data que nao existe no calendario', () => {
    expect(() => normalizeDueDate('2026-02-31')).toThrow(/invalida/);
  });
});

describe('isOverdue', () => {
  it('marca como atrasada quando o prazo ja passou', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-09-01' }), NOW)).toBe(true);
  });

  it('nao marca como atrasada no proprio dia do prazo', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-09-07' }), NOW)).toBe(false);
  });

  it('nunca marca tarefa concluida como atrasada', () => {
    const task = makeTask({ dueDate: '2026-01-01', status: 'concluida' });
    expect(isOverdue(task, NOW)).toBe(false);
  });
});

describe('daysUntilDue', () => {
  it('conta os dias restantes', () => {
    expect(daysUntilDue(makeTask({ dueDate: '2026-09-09' }), NOW)).toBe(2);
  });

  it('retorna negativo para prazo vencido', () => {
    expect(daysUntilDue(makeTask({ dueDate: '2026-09-04' }), NOW)).toBe(-3);
  });
});

describe('priorityWeight', () => {
  it('ordena urgente acima de baixa', () => {
    expect(priorityWeight('urgente')).toBeGreaterThan(priorityWeight('baixa'));
  });
});

describe('ordenacao por urgencia', () => {
  it('coloca atrasadas antes das demais', () => {
    const atrasada = makeTask({ id: 'atrasada', dueDate: '2026-08-30' });
    const futura = makeTask({ id: 'futura', dueDate: '2026-12-01' });
    expect(compareByUrgency(futura, atrasada, NOW)).toBeGreaterThan(0);
  });

  it('desempata pelo prazo e depois pela prioridade', () => {
    const tasks = [
      makeTask({ id: 'c', dueDate: '2026-10-01', priority: 'baixa' }),
      makeTask({ id: 'b', dueDate: '2026-09-20', priority: 'media' }),
      makeTask({ id: 'a', dueDate: '2026-09-20', priority: 'urgente' }),
    ];
    expect(sortByUrgency(tasks, NOW).map((task) => task.id)).toEqual(['a', 'b', 'c']);
  });

  it('nao muda o array original', () => {
    const tasks = [makeTask({ id: 'x', dueDate: '2026-12-01' }), makeTask({ id: 'y' })];
    sortByUrgency(tasks, NOW);
    expect(tasks[0]?.id).toBe('x');
  });
});

describe('createTask', () => {
  it('nasce pendente e com prioridade media por padrao', () => {
    const task = createTask(
      { title: 'Revisar UML', subject: 'An Pr Si', dueDate: '2026-10-10' },
      'id-1',
      NOW
    );
    expect(task).toMatchObject({ id: 'id-1', status: 'pendente', priority: 'media' });
    expect(task.completedAt).toBeNull();
  });
});

describe('completeTask / reopenTask', () => {
  it('conclui e registra o horario', () => {
    const done = completeTask(makeTask(), NOW);
    expect(done.status).toBe('concluida');
    expect(done.completedAt).toBe(NOW.toISOString());
  });

  it('nao permite concluir duas vezes', () => {
    expect(() => completeTask(makeTask({ status: 'concluida' }), NOW)).toThrow(/ja foi concluida/);
  });

  it('reabre limpando a data de conclusao', () => {
    const reopened = reopenTask(makeTask({ status: 'concluida', completedAt: NOW.toISOString() }));
    expect(reopened).toMatchObject({ status: 'pendente', completedAt: null });
  });

  it('nao reabre tarefa que nao esta concluida', () => {
    expect(() => reopenTask(makeTask())).toThrow(DomainError);
  });
});

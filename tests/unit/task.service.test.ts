import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryTaskRepository } from '../../src/repositories/in-memory-task.repository.js';
import { TaskService } from '../../src/services/task.service.js';

const NOW = new Date('2026-09-07T12:00:00.000Z');

describe('TaskService', () => {
  let repository: InMemoryTaskRepository;
  let service: TaskService;
  let counter: number;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    counter = 0;
    service = new TaskService(repository, { now: () => NOW }, () => `id-${++counter}`);
  });

  it('cria tarefa com id gerado e campos calculados', async () => {
    const task = await service.create({
      title: 'Configurar pipeline',
      subject: 'Integracao DevOps',
      dueDate: '2026-09-09',
      priority: 'urgente',
    });

    expect(task.id).toBe('id-1');
    expect(task.overdue).toBe(false);
    expect(task.daysLeft).toBe(2);
  });

  it('lista ordenando atrasadas primeiro', async () => {
    await service.create({ title: 'Tarefa futura', subject: 'De We', dueDate: '2026-12-01' });
    await service.create({ title: 'Tarefa atrasada', subject: 'Ai Es Da', dueDate: '2026-08-20' });

    const tasks = await service.list();
    expect(tasks[0]?.title).toBe('Tarefa atrasada');
    expect(tasks[0]?.overdue).toBe(true);
  });

  it('filtra por materia ignorando maiusculas', async () => {
    await service.create({
      title: 'Fila de prioridade',
      subject: 'Ai Es Da',
      dueDate: '2026-10-01',
    });
    await service.create({ title: 'Layout do front', subject: 'De We', dueDate: '2026-10-02' });

    const tasks = await service.list({ subject: 'ai es da' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.subject).toBe('Ai Es Da');
  });

  it('filtra por status', async () => {
    const first = await service.create({
      title: 'Escrever testes',
      subject: 'Integracao DevOps',
      dueDate: '2026-09-08',
    });
    await service.create({ title: 'Modelar UML', subject: 'An Pr Si', dueDate: '2026-09-30' });
    await service.complete(first.id);

    const done = await service.list({ status: 'concluida' });
    expect(done.map((task) => task.title)).toEqual(['Escrever testes']);
  });

  it('atualiza apenas os campos enviados', async () => {
    const task = await service.create({
      title: 'Rascunho',
      subject: 'Bo III',
      dueDate: '2026-11-01',
    });

    const updated = await service.update(task.id, { title: 'Titulo revisado' });
    expect(updated.title).toBe('Titulo revisado');
    expect(updated.subject).toBe('Bo III');
    expect(updated.dueDate).toBe('2026-11-01');
  });

  it('conclui e reabre a tarefa', async () => {
    const task = await service.create({
      title: 'Proteger branch main',
      subject: 'Integracao DevOps',
      dueDate: '2026-09-08',
    });

    const done = await service.complete(task.id);
    expect(done.status).toBe('concluida');

    const reopened = await service.reopen(task.id);
    expect(reopened.status).toBe('pendente');
    expect(reopened.completedAt).toBeNull();
  });

  it('remove a tarefa', async () => {
    const task = await service.create({
      title: 'Tarefa descartavel',
      subject: 'CC',
      dueDate: '2026-10-05',
    });

    await service.remove(task.id);
    await expect(service.get(task.id)).rejects.toThrow(/nao encontrada/);
  });

  it('lanca 404 ao buscar id inexistente', async () => {
    await expect(service.get('nao-existe')).rejects.toMatchObject({ status: 404 });
  });

  it('rejeita titulo invalido na criacao', async () => {
    await expect(
      service.create({ title: 'ab', subject: 'CC', dueDate: '2026-10-05' })
    ).rejects.toThrow(/pelo menos 3 caracteres/);
  });

  it('monta o resumo do painel', async () => {
    await service.create({ title: 'Atrasada 1', subject: 'Ai Es Da', dueDate: '2026-08-01' });
    const done = await service.create({
      title: 'Concluida 1',
      subject: 'De We',
      dueDate: '2026-09-06',
    });
    await service.create({ title: 'Pendente 1', subject: 'Bo III', dueDate: '2026-12-01' });
    await service.complete(done.id);

    expect(await service.summary()).toEqual({
      total: 3,
      pendentes: 2,
      concluidas: 1,
      atrasadas: 1,
    });
  });
});

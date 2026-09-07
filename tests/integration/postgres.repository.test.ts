import type pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPool, runMigrations } from '../../src/db/pool.js';
import { PostgresTaskRepository } from '../../src/repositories/postgres-task.repository.js';
import { TaskService } from '../../src/services/task.service.js';

const databaseUrl = process.env.DATABASE_URL;

// Roda no CI (onde o job sobe um service container de Postgres) e localmente
// quando o docker compose estiver de pe. Sem DATABASE_URL, o bloco e ignorado.
describe.skipIf(!databaseUrl)('PostgresTaskRepository', () => {
  let pool: pg.Pool;
  let service: TaskService;

  beforeAll(async () => {
    pool = createPool(databaseUrl as string);
    await runMigrations(pool);
    service = new TaskService(new PostgresTaskRepository(pool));
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE tasks');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('persiste e recupera a tarefa', async () => {
    const created = await service.create({
      title: 'Persistir no Postgres',
      subject: 'Integracao DevOps',
      dueDate: '2026-09-09',
      priority: 'alta',
    });

    const found = await service.get(created.id);
    expect(found).toMatchObject({
      title: 'Persistir no Postgres',
      subject: 'Integracao DevOps',
      dueDate: '2026-09-09',
      priority: 'alta',
      status: 'pendente',
    });
  });

  it('atualiza o status ao concluir', async () => {
    const created = await service.create({
      title: 'Concluir no banco',
      subject: 'Bo III',
      dueDate: '2026-10-01',
    });

    await service.complete(created.id);
    const found = await service.get(created.id);

    expect(found.status).toBe('concluida');
    expect(found.completedAt).not.toBeNull();
  });

  it('filtra por materia direto no SQL', async () => {
    await service.create({ title: 'Tarefa de web', subject: 'De We', dueDate: '2026-10-02' });
    await service.create({ title: 'Tarefa de aeds', subject: 'Ai Es Da', dueDate: '2026-10-03' });

    const tasks = await service.list({ subject: 'de we' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe('Tarefa de web');
  });

  it('remove do banco', async () => {
    const created = await service.create({
      title: 'Vai ser apagada',
      subject: 'CC',
      dueDate: '2026-10-04',
    });

    await service.remove(created.id);
    await expect(service.get(created.id)).rejects.toThrow(/nao encontrada/);
  });
});

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { InMemoryTaskRepository } from '../../src/repositories/in-memory-task.repository.js';
import { TaskService } from '../../src/services/task.service.js';

const NOW = new Date('2026-09-07T12:00:00.000Z');

function buildApp() {
  const repository = new InMemoryTaskRepository();
  const service = new TaskService(repository, { now: () => NOW });
  return createApp(service);
}

let app: ReturnType<typeof buildApp>;

const validPayload = {
  title: 'Subir pipeline de CI',
  subject: 'Integracao DevOps',
  dueDate: '2026-09-09',
  priority: 'urgente' as const,
};

beforeEach(() => {
  app = buildApp();
});

describe('GET /api/health', () => {
  it('responde ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('POST /api/tasks', () => {
  it('cria a tarefa e devolve 201', async () => {
    const response = await request(app).post('/api/tasks').send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      title: validPayload.title,
      status: 'pendente',
      priority: 'urgente',
    });
    expect(response.body.data.id).toBeTruthy();
  });

  it('devolve 400 quando falta campo obrigatorio', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'Sem materia' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });

  it('devolve 400 para prioridade fora do dominio', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ ...validPayload, priority: 'altissima' });
    expect(response.status).toBe(400);
  });

  it('devolve 422 quando o titulo quebra a regra de negocio', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ ...validPayload, title: 'ab' });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/tasks', () => {
  it('lista vazia no inicio', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('filtra por materia via query string', async () => {
    await request(app).post('/api/tasks').send(validPayload);
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Estudar listas', subject: 'Ai Es Da', dueDate: '2026-10-01' });

    const response = await request(app).get('/api/tasks').query({ subject: 'Ai Es Da' });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].subject).toBe('Ai Es Da');
  });
});

describe('ciclo de vida da tarefa', () => {
  it('conclui, bloqueia conclusao repetida e reabre', async () => {
    const created = await request(app).post('/api/tasks').send(validPayload);
    const id = created.body.data.id;

    const completed = await request(app).post(`/api/tasks/${id}/complete`);
    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe('concluida');

    const again = await request(app).post(`/api/tasks/${id}/complete`);
    expect(again.status).toBe(409);

    const reopened = await request(app).post(`/api/tasks/${id}/reopen`);
    expect(reopened.status).toBe(200);
    expect(reopened.body.data.status).toBe('pendente');
  });

  it('atualiza e remove', async () => {
    const created = await request(app).post('/api/tasks').send(validPayload);
    const id = created.body.data.id;

    const patched = await request(app).patch(`/api/tasks/${id}`).send({ priority: 'baixa' });
    expect(patched.body.data.priority).toBe('baixa');

    const removed = await request(app).delete(`/api/tasks/${id}`);
    expect(removed.status).toBe(204);

    const missing = await request(app).get(`/api/tasks/${id}`);
    expect(missing.status).toBe(404);
  });

  it('recusa PATCH sem nenhum campo', async () => {
    const created = await request(app).post('/api/tasks').send(validPayload);
    const response = await request(app).patch(`/api/tasks/${created.body.data.id}`).send({});
    expect(response.status).toBe(400);
  });
});

describe('GET /api/tasks/summary', () => {
  it('retorna os contadores do painel', async () => {
    await request(app).post('/api/tasks').send(validPayload);
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Tarefa atrasada', subject: 'De We', dueDate: '2026-08-01' });

    const response = await request(app).get('/api/tasks/summary');
    expect(response.body.data).toEqual({
      total: 2,
      pendentes: 2,
      concluidas: 0,
      atrasadas: 1,
    });
  });
});

describe('rota inexistente', () => {
  it('responde 404 em JSON', async () => {
    const response = await request(app).get('/api/nao-existe');
    expect(response.status).toBe(404);
    expect(response.body.error).toBeTruthy();
  });
});

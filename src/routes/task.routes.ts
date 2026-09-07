import { Router } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../domain/task.js';
import { createTaskSchema, listQuerySchema, updateTaskSchema } from '../domain/task.schema.js';
import type { TaskService } from '../services/task.service.js';

function firstZodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Requisicao invalida.';
}

export function taskRoutes(service: TaskService): Router {
  const router = Router();

  router.get('/tasks', async (req, res, next) => {
    try {
      const query = listQuerySchema.parse(req.query);
      res.json({ data: await service.list(query) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/tasks/summary', async (_req, res, next) => {
    try {
      res.json({ data: await service.summary() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/tasks/:id', async (req, res, next) => {
    try {
      res.json({ data: await service.get(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/tasks', async (req, res, next) => {
    try {
      const body = createTaskSchema.parse(req.body);
      res.status(201).json({ data: await service.create(body) });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/tasks/:id', async (req, res, next) => {
    try {
      const body = updateTaskSchema.parse(req.body);
      res.json({ data: await service.update(req.params.id, body) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/tasks/:id/complete', async (req, res, next) => {
    try {
      res.json({ data: await service.complete(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/tasks/:id/reopen', async (req, res, next) => {
    try {
      res.json({ data: await service.reopen(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/tasks/:id', async (req, res, next) => {
    try {
      await service.remove(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export { DomainError, ZodError, firstZodMessage };

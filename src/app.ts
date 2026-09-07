import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { DomainError } from './domain/task.js';
import { healthRoutes } from './routes/health.routes.js';
import { taskRoutes } from './routes/task.routes.js';
import type { TaskService } from './services/task.service.js';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

export function createApp(service: TaskService): Express {
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDir));
  app.use('/api', healthRoutes());
  app.use('/api', taskRoutes(service));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota nao encontrada.' });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? 'Requisicao invalida.' });
    }
    if (error instanceof DomainError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  });

  return app;
}

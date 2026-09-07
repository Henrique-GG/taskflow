import { Router } from 'express';

export function healthRoutes(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  return router;
}

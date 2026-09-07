import { loadConfig } from './config/env.js';
import { createPool, runMigrations } from './db/pool.js';
import { InMemoryTaskRepository } from './repositories/in-memory-task.repository.js';
import { PostgresTaskRepository } from './repositories/postgres-task.repository.js';
import type { TaskRepository } from './repositories/task.repository.js';
import { TaskService } from './services/task.service.js';
import { createApp } from './app.js';

async function main(): Promise<void> {
  const config = loadConfig();
  let repository: TaskRepository;

  if (config.repoDriver === 'postgres') {
    const pool = createPool(config.databaseUrl as string);
    await runMigrations(pool);
    repository = new PostgresTaskRepository(pool);
    console.log('[taskflow] repositorio: postgres');
  } else {
    repository = new InMemoryTaskRepository();
    console.log('[taskflow] repositorio: memoria');
  }

  const app = createApp(new TaskService(repository));
  app.listen(config.port, () => {
    console.log(`[taskflow] rodando em http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error('[taskflow] falha ao iniciar:', error);
  process.exit(1);
});

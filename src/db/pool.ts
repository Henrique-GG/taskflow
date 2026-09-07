import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString });
}

/** Roda o schema inicial. Idempotente, entao pode rodar a cada boot. */
export async function runMigrations(pool: pg.Pool): Promise<void> {
  const sql = readFileSync(join(here, 'migrations', '001_init.sql'), 'utf8');
  await pool.query(sql);
}

export interface AppConfig {
  port: number;
  repoDriver: 'memory' | 'postgres';
  databaseUrl: string | undefined;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const driver = env.REPO_DRIVER === 'postgres' ? 'postgres' : 'memory';
  if (driver === 'postgres' && !env.DATABASE_URL) {
    throw new Error('REPO_DRIVER=postgres exige a variavel DATABASE_URL.');
  }
  return {
    port: Number(env.PORT ?? 3000),
    repoDriver: driver,
    databaseUrl: env.DATABASE_URL,
  };
}

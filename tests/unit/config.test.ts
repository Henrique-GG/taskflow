import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/env.js';

describe('loadConfig', () => {
  it('usa memoria e porta 3000 por padrao', () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      repoDriver: 'memory',
      databaseUrl: undefined,
    });
  });

  it('le a porta do ambiente', () => {
    expect(loadConfig({ PORT: '8080' }).port).toBe(8080);
  });

  it('aceita o driver postgres quando ha DATABASE_URL', () => {
    const config = loadConfig({
      REPO_DRIVER: 'postgres',
      DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    });
    expect(config.repoDriver).toBe('postgres');
  });

  it('falha se pedir postgres sem DATABASE_URL', () => {
    expect(() => loadConfig({ REPO_DRIVER: 'postgres' })).toThrow(/DATABASE_URL/);
  });

  it('ignora driver desconhecido e cai para memoria', () => {
    expect(loadConfig({ REPO_DRIVER: 'mongo' }).repoDriver).toBe('memory');
  });
});

// O tsc so compila .ts. As migrations sao .sql, entao precisam ser copiadas
// para dist/ na mao, senao o build quebra ao rodar com REPO_DRIVER=postgres.
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/db/migrations', { recursive: true });
await cp('src/db/migrations', 'dist/db/migrations', { recursive: true });

console.log('[build] migrations copiadas para dist/db/migrations');

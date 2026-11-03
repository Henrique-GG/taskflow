# TaskFlow

Gestor de produtividade acadêmica: organiza tarefas por matéria, prazo e
prioridade, e mostra o que está atrasado antes que vire problema.

Projeto guarda-chuva que atravessa as disciplinas do semestre. Este repositório
concentra a trilha de **Integração DevOps** — versionamento, testes automatizados,
pipeline e infraestrutura.

[![CI](https://github.com/Henrique-GG/taskflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Henrique-GG/taskflow/actions/workflows/ci.yml)

## Stack

| Camada    | Tecnologia                              |
| --------- | --------------------------------------- |
| Runtime   | Node.js 20+                             |
| Linguagem | TypeScript (modo estrito)               |
| API       | Express 4                               |
| Validação | Zod                                     |
| Banco     | PostgreSQL 16 (com fallback em memória) |
| Testes    | Vitest + Supertest                      |
| Qualidade | ESLint + Prettier                       |
| CI        | GitHub Actions                          |
| Interface | HTML, CSS e JavaScript sem build        |

## Arquitetura

```
Navegador (public/)
        │  fetch /api
        ▼
  Rotas Express  ──►  TaskService  ──►  TaskRepository (porta)
  valida entrada      regras de uso        │
        │                                  ├── InMemoryTaskRepository
        ▼                                  └── PostgresTaskRepository
   Domínio puro                                        │
   (src/domain)                                        ▼
   sem I/O, 100% testável                        PostgreSQL
```

A decisão central é o repositório ser uma **porta com duas implementações**. Isso
permite rodar a suíte inteira sem banco (rápido, determinístico) e ainda assim
validar o SQL de verdade no pipeline, onde o CI sobe um container de Postgres.

## Rodando localmente

```bash
git clone https://github.com/Henrique-GG/taskflow.git
cd taskflow
npm ci
cp .env.example .env
npm run dev
```

Abra `http://localhost:3000`.

### Com PostgreSQL

```bash
docker compose up -d db
REPO_DRIVER=postgres DATABASE_URL=postgres://taskflow:taskflow@localhost:5432/taskflow npm run dev
```

As migrations rodam sozinhas na inicialização (`src/db/migrations/001_init.sql`).

## Scripts

| Comando                 | O que faz                                      |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Servidor com reload automático                 |
| `npm run build`         | Compila TypeScript para `dist/`                |
| `npm start`             | Roda a versão compilada                        |
| `npm test`              | Suíte completa                                 |
| `npm run test:coverage` | Testes com relatório de cobertura (mínimo 70%) |
| `npm run lint`          | ESLint sem tolerância a warnings               |
| `npm run typecheck`     | Checagem de tipos                              |
| `npm run format:check`  | Conferência de formatação                      |

## API

Base: `/api`

| Método   | Rota                  | Descrição                               |
| -------- | --------------------- | --------------------------------------- |
| `GET`    | `/health`             | Health check usado pelo pipeline        |
| `GET`    | `/tasks`              | Lista tarefas (`?status=`, `?subject=`) |
| `GET`    | `/tasks/summary`      | Contadores do painel                    |
| `GET`    | `/tasks/:id`          | Busca uma tarefa                        |
| `POST`   | `/tasks`              | Cria tarefa                             |
| `PATCH`  | `/tasks/:id`          | Atualiza campos                         |
| `POST`   | `/tasks/:id/complete` | Conclui                                 |
| `POST`   | `/tasks/:id/reopen`   | Reabre                                  |
| `DELETE` | `/tasks/:id`          | Remove                                  |

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Entregar marco 1","subject":"Integração DevOps","dueDate":"2026-09-09","priority":"urgente"}'
```

Códigos de erro: `400` entrada malformada, `404` não encontrado, `409` conflito
de estado (concluir uma tarefa já concluída), `422` regra de negócio violada.

## Testes

```
tests/unit/task.domain.test.ts          regras puras: prazos, ordenação, validação
tests/unit/task.service.test.ts         casos de uso com repositório em memória
tests/unit/config.test.ts               carregamento de configuração
tests/integration/tasks.api.test.ts     API HTTP ponta a ponta (Supertest)
tests/integration/postgres.repository.test.ts   SQL real (roda quando há DATABASE_URL)
```

O relógio e o gerador de ids são injetados no `TaskService`, então nada depende
da data em que a suíte roda.

## Pipeline de CI

`.github/workflows/ci.yml` dispara a cada push na `main` e a cada Pull Request:

```
┌─ qualidade ──┐
│ format:check │
│ lint         │──┐
│ typecheck    │  │
└──────────────┘  ├──► build ──► compila ──► sobe o servidor ──► health check ──► artefato
┌─ testes ─────┐  │
│ postgres:16  │──┘
│ unit + integ │
│ cobertura    │
└──────────────┘
┌─ seguranca ──┐
│ npm audit    │
└──────────────┘
```

`.github/workflows/commit-lint.yml` valida as mensagens de commit do PR contra o
padrão Conventional Commits.

## Convenções do repositório

- [Estratégia de ramificação (trunk-based)](docs/estrategia-de-branches.md)
- [Proteção da branch `main`](docs/protecao-de-branch.md)
- [Papéis e organização](docs/papeis-e-organizacao.md)
- [Guia de contribuição](CONTRIBUTING.md)

## Roadmap da disciplina

- **A1 — Marco 1 (CI e conteinerização inicial):** repositório estruturado,
  testes automatizados e pipeline de CI operacional. ✅
- **A2 — Fase 2 (IaC e CD):** Dockerfile multi-stage, orquestração via Compose,
  publicação de imagem no GHCR, gestão de segredos, versionamento semântico e
  rollback automatizado. ✅
- **A3 — Fase 3 (DevSecOps e observabilidade):** SAST com Trivy/SonarQube,
  instrumentação de logs e métricas, dashboard no Grafana e demo ao vivo.

## Autoria

Henrique Guimarães Gonçalves e Ian Felipe — Ciência da Computação, CEUB.
Disciplina Integração DevOps, 2026/2, Prof. Danilo Silva.

A divisão de papéis está em [`docs/papeis-e-organizacao.md`](docs/papeis-e-organizacao.md).

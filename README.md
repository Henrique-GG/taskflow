# TaskFlow

Gestor de produtividade acadêmica: organiza tarefas por matéria, prazo e
prioridade, e mostra o que está atrasado antes que vire problema.

Projeto guarda-chuva que atravessa as disciplinas do semestre. Este repositório
concentra a trilha de **Integração DevOps** — versionamento, testes automatizados,
pipeline e infraestrutura.

[![CI](https://github.com/Henrique-GG/taskflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Henrique-GG/taskflow/actions/workflows/ci.yml)
[![CD](https://github.com/Henrique-GG/taskflow/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/Henrique-GG/taskflow/actions/workflows/docker-publish.yml)

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
| CI/CD     | GitHub Actions                          |
| Imagem    | Docker (multi-stage) + Docker Compose   |
| Registry  | GitHub Container Registry (GHCR)        |
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

### Com Docker (recomendado)

Sobe a aplicação e o PostgreSQL juntos, com um comando:

```bash
git clone https://github.com/Henrique-GG/taskflow.git
cd taskflow
docker compose up --build
```

Abra `http://localhost:3000`. O Compose espera o banco ficar saudável
(`pg_isready`) antes de subir a aplicação, e as migrations rodam sozinhas.

Para usar credenciais próprias, crie um `.env` a partir do `.env.example`. Os
valores padrão são de desenvolvimento e não são credenciais reais.

### Sem Docker

```bash
npm ci
cp .env.example .env
npm run dev
```

Nesse modo a aplicação sobe com repositório em memória, sem precisar de banco.
Para apontar para um PostgreSQL:

```bash
docker compose up -d db
REPO_DRIVER=postgres DATABASE_URL=postgres://taskflow:taskflow_dev@localhost:5432/taskflow npm run dev
```

> A variável `REPO_DRIVER` é obrigatória: sem ela a aplicação usa o repositório
> em memória e ignora o banco.

### A partir da imagem publicada

```bash
docker pull ghcr.io/henrique-gg/taskflow:latest
```

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

## Entrega contínua (CD)

`.github/workflows/docker-publish.yml` dispara a cada push na `main` e a cada
tag de versão `v*.*.*`:

```
┌─ publicar ───────────────┐      ┌─ homologacao ────────────────┐
│ build da imagem          │      │ baixa a imagem publicada     │
│ tags derivadas do Git    │ ───► │ sobe a stack com o banco     │
│ push para o GHCR         │      │ valida pelo health check     │
└──────────────────────────┘      └──────────────────────────────┘
```

O ambiente de homologação é simulado dentro do runner. Ele consome a **imagem
publicada no registry**, e não o código do repositório — é o que garante que o
artefato entregue é o mesmo que foi validado.

As credenciais vêm dos Secrets do repositório (`POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`). Nenhuma senha está versionada.

### Versionamento das imagens

Imagem: [`ghcr.io/henrique-gg/taskflow`](https://github.com/Henrique-GG/taskflow/pkgs/container/taskflow)

| Referência no Git | Tags geradas na imagem                |
| ----------------- | ------------------------------------- |
| tag `v0.2.0`      | `0.2.0`, `0.2`, `latest`, `sha-<...>` |
| push na `main`    | `main`, `latest`, `sha-<...>`         |

A tag com o SHA permite rastrear qualquer imagem até o commit que a originou.

### Rollback

`.github/workflows/rollback.yml` é acionado manualmente em **Actions → Rollback
→ Run workflow**, informando a versão de destino.

Ele confere se a versão existe no registry, implanta, valida pelo health check e
registra no resumo da execução qual imagem ficou no ar e quanto tempo levou.
Como não há build nem testes no caminho, o rollback leva cerca de 13 segundos.

O procedimento e o post-mortem de um incidente real de deploy estão em
[`docs/rollback.md`](docs/rollback.md).

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

# Papéis e organização do trabalho

O projeto da disciplina pede divisão em funções específicas (Desenvolvimento,
Qualidade e Operações/Infraestrutura) e avalia a organização das atividades.

## Divisão de papéis

O projeto começou individual na Fase 1 e passou a ter dois integrantes na
Fase 2, quando Ian Felipe assumiu Operações/Infraestrutura.

| Papel                      | Responsável | Escopo                                                                                                     |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| Desenvolvimento            | Henrique    | Domínio, serviço, rotas HTTP e interface web (`src/`, `public/`)                                           |
| Qualidade                  | Henrique    | Suíte de testes, cobertura mínima, ESLint/Prettier e revisão dos Pull Requests (`tests/`, configs de lint) |
| Operações / Infraestrutura | Ian Felipe  | Dockerfile, Docker Compose, publicação da imagem no GHCR e auditoria de dependências                       |

Na Fase 1, com o projeto individual, os três papéis estavam a cargo do
Henrique. O histórico do Git registra essa transição: os Pull Requests da
Fase 2 relativos a conteinerização e entrega contínua são de autoria do Ian,
revisados e aprovados pelo Henrique.

## Como as atividades são organizadas

- **Backlog:** GitHub Issues, uma issue por fatia entregável.
- **Quadro:** GitHub Projects com as colunas `A fazer → Em andamento → Em revisão → Concluído`.
- **Rastreabilidade:** cada branch cita a issue, e o PR fecha a issue com
  `Closes #<numero>`.
- **Revisão:** todo PR precisa de 1 aprovação e do CI verde. Quem escreveu o
  código não aprova o próprio PR.
- **Definição de pronto:** código na `main`, testes cobrindo o comportamento
  novo, pipeline verde e documentação atualizada quando o comportamento muda.

## Rastreabilidade das entregas do Marco 1 (A1)

| Entrega esperada                 | Onde está no repositório                                       |
| -------------------------------- | -------------------------------------------------------------- |
| Repositório Git estruturado      | `docs/estrategia-de-branches.md`, `docs/protecao-de-branch.md` |
| Estratégia trunk-based           | `docs/estrategia-de-branches.md`                               |
| Proteção da branch principal     | `docs/protecao-de-branch.md`, `.github/CODEOWNERS`             |
| Histórico de commits padronizado | `CONTRIBUTING.md`, `.github/workflows/commit-lint.yml`         |
| Aplicação inicial funcional      | `src/`, `public/`                                              |
| Testes unitários                 | `tests/unit/`                                                  |
| Testes de integração             | `tests/integration/`                                           |
| Pipeline de CI operacional       | `.github/workflows/ci.yml`                                     |
| Banco de dados                   | `src/db/migrations/001_init.sql`, `docker-compose.yml`         |

## Rastreabilidade das entregas da Fase 2 (A2)

| Entrega esperada                   | Onde está no repositório                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| Dockerfile otimizado               | `Dockerfile`, `.dockerignore`                                                  |
| Orquestração local                 | `docker-compose.yml`, `docker-compose.homolog.yml`                             |
| Pipeline de CD automatizado        | `.github/workflows/docker-publish.yml`                                         |
| Gestão segura de segredos          | Secrets do repositório e environment `homologacao`                             |
| Versionamento semântico e rollback | Tags `v0.2.0` e `v0.2.1`, `.github/workflows/rollback.yml`, `docs/rollback.md` |

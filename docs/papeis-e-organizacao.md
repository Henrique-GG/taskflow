# Papéis e organização do trabalho

O projeto da disciplina pede divisão em funções específicas (Desenvolvimento,
Qualidade e Operações/Infraestrutura) e avalia a organização das atividades.

## Divisão de papéis

| Papel                      | Responsável | Escopo no Marco 1                                                                                 |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| Desenvolvimento            | Henrique | Domínio, serviço, rotas HTTP e interface web (`src/`, `public/`)                                  |
| Qualidade                  | Henrique | Suíte de testes, meta de cobertura, ESLint/Prettier, revisão de PR (`tests/`, configs de lint)    |
| Operações / Infraestrutura | Henrique | GitHub Actions, proteção de branch, `docker-compose.yml`, segredos e releases (`.github/`, infra) |


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

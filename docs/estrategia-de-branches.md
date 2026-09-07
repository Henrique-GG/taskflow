# Estratégia de ramificação — Trunk-Based Development

## Por que trunk-based

O TaskFlow é um projeto guarda-chuva que vai receber contribuições de várias
disciplinas ao longo do semestre. Manter branches longas de release (GitFlow)
criaria merges grandes e conflitos difíceis. No trunk-based existe **uma única
branch de longa duração** (`main`), sempre pronta para build, e branches de vida
curta que voltam para ela rápido.

## Regras

1. `main` é a única branch permanente. Todo commit em `main` precisa passar no CI.
2. Ninguém dá push direto em `main`. A entrada é sempre por Pull Request.
3. Branches de trabalho vivem **no máximo 2 dias**. Se a tarefa é maior, ela é
   quebrada em fatias menores ou entregue atrás de uma feature flag.
4. Toda branch sai de `main` atualizada e volta para `main`.
5. Merge por **squash**, para que o histórico de `main` seja uma linha limpa de
   commits padronizados.

## Nomenclatura de branches

```
<tipo>/<descricao-curta-em-kebab-case>
```

| Tipo       | Uso                                    | Exemplo                        |
| ---------- | -------------------------------------- | ------------------------------ |
| `feat`     | Nova funcionalidade                    | `feat/filtro-por-materia`      |
| `fix`      | Correção de bug                        | `fix/prazo-fora-do-fuso`       |
| `chore`    | Manutenção, dependências, configuração | `chore/atualizar-eslint`       |
| `ci`       | Pipeline e automação                   | `ci/cache-do-npm`              |
| `docs`     | Documentação                           | `docs/estrategia-de-branches`  |
| `test`     | Só testes                              | `test/cobertura-do-servico`    |
| `refactor` | Refatoração sem mudar comportamento    | `refactor/extrair-repositorio` |

## Fluxo de trabalho

```
git switch main
git pull origin main
git switch -c feat/filtro-por-materia

# ...código + testes...
npm run lint && npm run typecheck && npm test

git add .
git commit -m "feat(tarefas): filtrar listagem por materia"
git push -u origin feat/filtro-por-materia
# abrir Pull Request para main, esperar o CI ficar verde, pedir review
```

Depois do merge:

```
git switch main
git pull origin main
git branch -d feat/filtro-por-materia
```

## Padrão de commits — Conventional Commits

```
<tipo>(<escopo opcional>): <descrição no imperativo, minúscula, sem ponto final>
```

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

Exemplos válidos:

- `feat(tarefas): adicionar endpoint de conclusao`
- `fix(dominio): rejeitar data 2026-02-31`
- `ci: rodar testes contra postgres no pipeline`

O workflow `.github/workflows/commit-lint.yml` reprova o PR se algum commit
fugir desse padrão, então a regra é verificada automaticamente e não no olho.

## Versionamento

Tags seguem versionamento semântico (`v0.1.0`, `v0.2.0`, ...). A automação de
release e a publicação de imagem entram na fase A2.

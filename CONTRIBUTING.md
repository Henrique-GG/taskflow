# Como contribuir

## Antes de começar

```bash
npm ci
cp .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:3000` usando repositório em memória. Para
trabalhar com banco de verdade:

```bash
docker compose up -d db
REPO_DRIVER=postgres DATABASE_URL=postgres://taskflow:taskflow@localhost:5432/taskflow npm run dev
```

## Checagens locais antes de abrir PR

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
```

Essas são exatamente as checagens que o CI roda. Se passar aqui, passa lá.

## Padrão de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
<tipo>(<escopo>): <descrição no imperativo>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
`ci`, `chore`, `revert`. O escopo é opcional. A descrição vai em minúscula, no
imperativo, sem ponto final e com até 72 caracteres.

```bash
git commit -m "feat(tarefas): adicionar filtro por materia"
git commit -m "fix(dominio): tratar data invalida de fevereiro"
git commit -m "ci: rodar testes contra postgres"
```

O workflow `commit-lint` reprova o PR se algum commit fugir do padrão.

## Fluxo

Detalhado em [`docs/estrategia-de-branches.md`](docs/estrategia-de-branches.md).
Resumo: branch curta saindo de `main`, PR, CI verde, 1 aprovação, merge por
squash, apaga a branch.

## Onde colocar cada coisa

| Pasta               | O que vive aqui                                     |
| ------------------- | --------------------------------------------------- |
| `src/domain`        | Regras de negócio puras, sem I/O. Fáceis de testar. |
| `src/services`      | Orquestra domínio + repositório.                    |
| `src/repositories`  | Persistência. Uma porta, duas implementações.       |
| `src/routes`        | Camada HTTP fina: valida entrada e delega.          |
| `public`            | Interface web em HTML/CSS/JS, sem build.            |
| `tests/unit`        | Testes sem I/O.                                     |
| `tests/integration` | Testes que sobem a aplicação ou tocam o banco.      |

Toda mudança de comportamento entra acompanhada de teste. A cobertura mínima
configurada é 70% e o CI falha abaixo disso.

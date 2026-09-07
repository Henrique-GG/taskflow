# Proteção da branch `main`

Esta configuração é feita na interface do GitHub e é uma das entregas avaliadas
do Marco 1. O passo a passo abaixo usa **Rulesets**, que é o recurso atual do
GitHub (a tela antiga de _Branch protection rules_ também funciona).

## Passo a passo

1. No repositório, abra **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. Em **Ruleset Name**, use `protecao-main`.
3. Em **Enforcement status**, selecione **Active**.
4. Em **Target branches → Add target → Include default branch**.
5. Marque as regras abaixo:

| Regra                                                 | Por quê                                          |
| ----------------------------------------------------- | ------------------------------------------------ |
| **Restrict deletions**                                | Impede apagar a `main` por acidente.             |
| **Block force pushes**                                | O histórico da `main` não pode ser reescrito.    |
| **Require linear history**                            | Casa com o merge por squash do trunk-based.      |
| **Require a pull request before merging**             | Nada entra sem PR.                               |
| → Required approvals: **1**                           | Revisão de outro integrante antes do merge.      |
| → Dismiss stale approvals when new commits are pushed | Um push novo invalida a aprovação antiga.        |
| → Require review from Code Owners                     | Usa o arquivo `.github/CODEOWNERS`.              |
| **Require status checks to pass**                     | Só entra código com o pipeline verde.            |
| → Require branches to be up to date before merging    | Evita merge em cima de uma `main` desatualizada. |

6. Em **Require status checks to pass → Add checks**, adicione:
   - `Lint, formatacao e tipos`
   - `Testes automatizados`
   - `Build da aplicacao`
   - `Validar mensagens de commit`

   > Os checks só aparecem na busca depois que o workflow rodou pelo menos uma
   > vez. Abra um PR de teste primeiro, deixe o CI rodar e volte aqui.

7. Clique em **Create**.

## Como comprovar na avaliação

- Print da tela do ruleset ativo.
- Print de um `git push` direto na `main` sendo recusado pelo servidor.
- Print de um Pull Request com os checks obrigatórios listados e verdes.

## Conferindo pelo terminal

```bash
# deve ser recusado com "protected branch hook declined"
git switch main
echo "teste" >> README.md
git commit -am "chore: teste de protecao"
git push origin main
```

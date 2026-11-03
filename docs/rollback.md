# Versionamento e rollback

## Versionamento semantico

As imagens seguem SemVer (`MAJOR.MINOR.PATCH`) e sao publicadas no GitHub
Container Registry a cada tag `v*.*.*` criada no repositorio. O
`docker/metadata-action` deriva as tags da imagem a partir da referencia do
Git, normalizando o prefixo `v`.

Imagem: `ghcr.io/henrique-gg/taskflow`

| Tag no Git | Tags geradas na imagem                |
| ---------- | ------------------------------------- |
| `v0.2.0`   | `0.2.0`, `0.2`, `latest`, `sha-<...>` |
| `v0.2.1`   | `0.2.1`, `0.2`, `latest`, `sha-<...>` |

Cada publicacao tambem gera uma tag com o SHA do commit, o que permite
rastrear qualquer imagem ate o codigo exato que a originou.

## Incidente real registrado em 03/11/2026

A primeira publicacao da versao `v0.2.0` foi para homologacao com falha.
O registro completo esta no historico do GitHub Actions.

**Sintoma.** O job `Deploy em homologacao (simulado)` falhou sete segundos
apos o inicio, no passo que sobe a stack:

```
Implantando a imagem ghcr.io/henrique-gg/taskflow:0.2.0
api Pulling
api Error manifest unknown
Error response from daemon: manifest unknown
```

**Causa.** O `docker/metadata-action` estava sem a lista explicita de tags,
entao usava a referencia literal do Git. A imagem foi publicada como
`v0.2.0`, com o prefixo, enquanto o job de deploy procurava por `0.2.0`.
A mesma causa ja havia derrubado o deploy no push para a `main`, onde a
imagem saiu como `main` e o job procurava `latest`.

**Deteccao.** Pelo proprio pipeline. O job de publicacao concluiu com
sucesso e o de homologacao falhou em seguida, antes do health check chegar
a ser executado. Nenhuma versao defeituosa ficou no ar.

**Correcao.** Pull request #4, declarando as tags explicitamente com
`type=semver`, que normaliza `v0.2.0` para `0.2.0` e publica `latest` na
branch padrao. A tag foi recriada apontando para o commit corrigido e a
publicacao seguinte concluiu com os dois jobs verdes.

**Licao.** O deploy em homologacao e o que separou um erro de configuracao
de um problema em producao. Como ele consome a imagem publicada em vez de
construir a partir do codigo, a incompatibilidade entre o que foi publicado
e o que seria implantado apareceu no pipeline, e nao depois.

## Procedimento de rollback

O rollback nao reconstroi nada e nao depende do codigo-fonte: ele aponta o
ambiente para uma imagem que ja foi construida, publicada e validada antes.

```bash
# versao atual em homologacao
TAG=0.2.1 docker compose -f docker-compose.homolog.yml up -d
curl http://localhost:3000/api/health

# rollback para a versao anterior
TAG=0.2.0 docker compose -f docker-compose.homolog.yml up -d
curl http://localhost:3000/api/health

# confirmar qual imagem esta no ar
docker compose -f docker-compose.homolog.yml images
```

As credenciais vem de um arquivo `.env` local, fora do controle de versao.

Tempo medido ate o servico voltar: _preencher apos a execucao_.

## Por que funciona

Cada versao fica publicada no registry sob sua propria tag imutavel. Voltar
para uma versao anterior e trocar a referencia da imagem e subir de novo,
sem passar por build, testes ou qualquer etapa que dependa do repositorio.
E por isso que o rollback leva segundos enquanto um deploy completo leva
minutos.

## Evidencias

- Print: imagem publicada no GHCR com as duas versoes
- Print: execucao do pipeline que falhou (manifest unknown) e a seguinte, corrigida
- Print: aplicacao respondendo na versao mais recente
- Print: aplicacao respondendo na versao anterior apos o rollback

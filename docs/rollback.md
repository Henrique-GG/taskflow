# Versionamento e rollback

## Versionamento semantico

As imagens seguem SemVer (`MAJOR.MINOR.PATCH`) e sao publicadas no GitHub
Container Registry a cada tag `v*.*.*` criada no repositorio. O
`docker/metadata-action` deriva as tags da imagem a partir da tag do Git.

Imagem: `ghcr.io/henrique-gg/taskflow`

| Tag no Git | Tags geradas na imagem                |
| ---------- | ------------------------------------- |
| `v0.2.0`   | `0.2.0`, `0.2`, `latest`, `sha-<...>` |
| `v0.2.1`   | `0.2.1`, `0.2`, `latest`, `sha-<...>` |

Cada publicacao tambem gera uma tag com o SHA do commit, o que permite
rastrear qualquer imagem ate o codigo exato que a originou.

## Cenario de falha simulado

> Preencher com o que aconteceu de fato na execucao: qual versao foi para
> homologacao, o que deixou de funcionar e como isso foi percebido (health
> check falhando, erro no log, endpoint devolvendo 500).

## Procedimento de rollback

O rollback nao reconstroi nada e nao depende do codigo-fonte: ele aponta o
ambiente para uma imagem que ja foi construida e validada antes.

```bash
# versao com problema em homologacao
TAG=0.2.1 docker compose -f docker-compose.homolog.yml up -d

# rollback para a versao anterior
TAG=0.2.0 docker compose -f docker-compose.homolog.yml up -d

# confirmar qual imagem esta no ar
docker compose -f docker-compose.homolog.yml images
curl -s http://localhost:3000/api/health
```

Tempo ate o servico voltar: _preencher com o medido_.

## Por que funciona

Cada versao fica publicada no registry sob sua propria tag imutavel. Voltar
para uma versao anterior e trocar a referencia da imagem e subir de novo,
sem passar por build, testes ou qualquer etapa que dependa do repositorio.
E por isso que o rollback leva segundos enquanto um deploy completo leva
minutos.

## Evidencias

- Print: imagem publicada no GHCR com as duas versoes
- Print: aplicacao respondendo na versao mais recente
- Print: aplicacao respondendo na versao anterior apos o rollback

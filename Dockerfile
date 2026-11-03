# ---------- Estagio 1: build ----------
# Compila o TypeScript e copia as migrations para dist/.
FROM node:20-alpine AS builder

WORKDIR /app

# Copia so os manifestos primeiro: enquanto eles nao mudarem, o Docker
# reaproveita a camada de instalacao em cache e o build fica mais rapido.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Estagio 2: producao ----------
# Imagem final: so o que a aplicacao precisa para rodar.
# Sem TypeScript, sem devDependencies, sem codigo-fonte.
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# dist/ ja contem as migrations (.sql), copiadas pelo scripts/copy-assets.mjs
COPY --from=builder /app/dist ./dist
# A interface web e servida como arquivo estatico a partir de /app/public.
COPY public ./public

# Roda como usuario sem privilegios, nunca como root.
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]

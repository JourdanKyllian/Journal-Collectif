# Build Stage
FROM node:22-slim AS builder

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Configuration Monorepo : intégration du lockfile global et des workspaces requis
COPY package.json package-lock.json ./
COPY backend ./backend
COPY frontend ./frontend

RUN npm ci --legacy-peer-deps

WORKDIR /app/backend
RUN npm run build
RUN npm prune --production --legacy-peer-deps

# Production Stage
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app

# Restauration du contexte global et de la topologie monorepo
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Préservation de l'arborescence du service pour la résolution des assets statiques (Swagger)
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_module[s] ./backend/node_modules

ENV NODE_ENV=production
EXPOSE 3000

# Isolation du contexte d'exécution de l'API
WORKDIR /app/backend
CMD ["node", "dist/main.js"]
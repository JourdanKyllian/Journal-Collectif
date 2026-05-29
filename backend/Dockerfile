# ========== STAGE 1 : Build ==========
FROM node:22-slim AS builder
WORKDIR /app

# On profite du cache des layers pour les dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copie du code source et compilation TS -> JS
COPY . .
RUN npm run build

# On nettoie les dépendances pour ne garder que la prod (gain de place énorme)
RUN npm prune --production --legacy-peer-deps

# ========== STAGE 2 : Production ==========
FROM node:22-slim AS production

RUN apk update && apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/lib/node_modules/corepack

WORKDIR /app

ENV NODE_ENV=production

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# On ne récupère QUE le nécessaire du stage builder
# 1. Les modules de prod uniquement
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
# 2. Le code compilé (dist)
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
# 3. Le package.json
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# On passe sur l'utilisateur limité
USER appuser
EXPOSE 3000

# Le Healthcheck demandé par le CTO (utilise ton endpoint /health)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Lancement de l'app compilée
CMD ["node", "dist/src/main.js"]

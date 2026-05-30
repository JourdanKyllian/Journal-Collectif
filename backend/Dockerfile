# ========== STAGE 1 : Build ==========
FROM node:22-slim AS builder
WORKDIR /app

# Copie des dépendances et cache des layers pour les dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copie du code source et compilation TS -> JS
COPY . .
RUN npm run build

# Nettoie les dépendances pour ne garder que la prod
RUN npm prune --production --legacy-peer-deps

# ========== STAGE 2 : Production ==========
FROM node:22-slim AS production
WORKDIR /app

# Maj OS, ajout de curl (pour le healthcheck) et nettoyage des caches apt
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Suppression de NPM pour un scan Trivy clean (zéro vulnérabilité critique)
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/lib/node_modules/corepack

ENV NODE_ENV=production

# Création d'un utilisateur non-root (Syntaxe Debian)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copie des fichiers depuis le builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# On passe sur l'utilisateur limité
USER appuser
EXPOSE 3000

# Healthcheck via curl (car wget n'est pas par défaut sur debian slim)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Lancement de l'app compilée (dist/main.js pour NestJS)
CMD ["node", "dist/main.js"]
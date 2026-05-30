# ========== STAGE 1 : Dépendances ==========
FROM node:22-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ========== STAGE 2 : Build ==========
FROM node:22-slim AS builder
WORKDIR /app

# Récupère les dépendances
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Désactive pour accélérer le build, la collecte des données de télémétrie de Next
ENV NEXT_TELEMETRY_DISABLED=1

# Compilation de l'application
RUN npm run build

# ========== STAGE 3 : Production ==========
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Maj OS, ajout de curl (pour le healthcheck) et nettoyage apt
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Suppression de NPM pour un scan Trivy clean (zéro vulnérabilité)
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/lib/node_modules/corepack

# Création d'un utilisateur non-root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Création du dossier .next avec les bons droits
RUN mkdir .next && chown appuser:appgroup .next

# Copie UNIQUEMENT ce qui est nécessaire depuis le stage builder
# Le dossier public (images statiques, favicon...)
COPY --from=builder --chown=appuser:appgroup /app/public ./public
# Le serveur standalone allégé
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
# Les assets statiques générés (JS/CSS)
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser
EXPOSE 3000

# Next.js standalone ne s'utilise plus avec "npm start"
CMD ["node", "server.js"]
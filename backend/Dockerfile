# ========== STAGE 1 : Build (Debian complet pour la compatibilité) ==========
FROM node:22-slim AS builder
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copie des dépendances et cache des layers
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copie du code source et compilation TS -> JS
COPY . .
RUN npm run build

# Nettoyage pour ne garder que la production (NPM est présent ici pour faire le prune)
RUN npm prune --production --legacy-peer-deps


# ========== STAGE 2 : Production (Distroless, sécurité maximale) ==========
# On utilise l'image Google Distroless (basée sur Debian 12 pour la compatibilité glibc)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app

# Copie UNIQUEMENT le code compilé et les modules de prod depuis le builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Variables d'environnement
ENV NODE_ENV=production

EXPOSE 3000

# Attention : Distroless exécute directement "node" par défaut, 
# donc on donne juste le chemin du fichier !
CMD ["dist/main.js"]
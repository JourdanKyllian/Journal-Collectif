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

# Désactive pour accélérer le build la collecte des données de télémétrie de Next
ENV NEXT_TELEMETRY_DISABLED=1

# Compilation de l'application (génère le dossier .next/standalone)
RUN npm run build

# ========== STAGE 3 : Production ==========
# On utilise la version "nonroot" officielle de Google (sécurité maximale d'office)
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# L'utilisateur "nonroot" existe déjà dans l'image (UID 65532)
# On copie le serveur standalone allégé
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
# On copie le dossier public (images statiques, favicon...)
COPY --from=builder --chown=nonroot:nonroot /app/public ./public
# On copie les assets statiques générés (JS/CSS)
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static

# On bascule sur l'utilisateur sécurisé de Distroless
USER nonroot
EXPOSE 3000

# L'image Distroless lance "node" par défaut
CMD ["server.js"]
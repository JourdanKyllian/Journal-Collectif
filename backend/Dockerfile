# ========== STAGE 1 : Build ==========
FROM node:22-slim AS builder
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build
RUN npm prune --production --legacy-peer-deps

# ========== STAGE 2 : Production ==========
# Utilise impérativement ":nonroot" pour la sécurité
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

# Le CMD doit pointer vers le binaire node + le fichier JS
# Distroless ne sait pas forcément lancer un .js directement sans node devant
CMD ["node", "dist/main.js"]
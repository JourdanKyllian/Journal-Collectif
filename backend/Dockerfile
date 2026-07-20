# Build Stage
FROM node:22-slim AS builder

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Le nettoyage sécurisé fonctionne à nouveau parfaitement en mode isolé
RUN npm prune --production --legacy-peer-deps

# Production Stage
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
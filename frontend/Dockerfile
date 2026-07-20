# Build Stage
FROM node:22-slim AS builder

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Configuration Monorepo : intégration du lockfile global et des workspaces requis
COPY package.json package-lock.json ./
COPY backend ./backend
COPY frontend ./frontend

RUN npm ci --legacy-peer-deps

WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production Stage
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Résolution des chemins de sortie pour le mode standalone Next.js en environnement workspace
COPY --from=builder --chown=nonroot:nonroot /app/frontend/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/frontend/public ./frontend/public
COPY --from=builder --chown=nonroot:nonroot /app/frontend/.next/static ./frontend/.next/static

USER nonroot
EXPOSE 3000

CMD ["frontend/server.js"]
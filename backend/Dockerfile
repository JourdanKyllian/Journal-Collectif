# Stage 1: Build environment
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production dependency installation (Isolated from build environment)
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Stage 3: Minimalist runtime environment
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000
CMD ["dist/main.js"]
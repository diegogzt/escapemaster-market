FROM node:20-alpine AS base
WORKDIR /app

# ── deps: install prod deps only ──────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── builder: full install + build ─────────────────────────────────────────────
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── runner: minimal production image ──────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]

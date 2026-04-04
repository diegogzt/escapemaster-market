FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Install deps fresh (no lockfile — resolves platform-specific binaries)
COPY package.json .npmrc ./
RUN apk add --no-cache git && npm install

# Build
COPY . .
RUN npm run build

# Remove dev deps after build
RUN npm prune --omit=dev

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]

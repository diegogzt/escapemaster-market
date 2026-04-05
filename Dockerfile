FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Public env vars needed at build time (Astro inlines them)
ENV PUBLIC_GOOGLE_CLIENT_ID=1057719615515-mf1blrrtj0k2su2vo633nlf6q34khp7n.apps.googleusercontent.com

# Clone fresh from GitHub — bypasses Dokploy's stale build context
RUN apk add --no-cache git && \
    git clone --depth=1 --branch main https://github.com/diegogzt/escapemaster-market.git . && \
    npm install

# Build
RUN npm run build

# Remove dev deps after build
RUN npm prune --omit=dev

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]

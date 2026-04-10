FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Install fuser for port management
RUN apk add --no-cache fuser psmisc

# Clone fresh from GitHub — bypasses Dokploy's stale build context
RUN apk add --no-cache git && \
    git clone --depth=1 --branch main https://github.com/diegogzt/escapemaster-market.git . && \
    npm install

# Build
RUN npm run build

# Remove dev deps after build
RUN npm prune --omit=dev

COPY docker-pre-start.sh /usr/local/bin/docker-pre-start.sh

EXPOSE 4321
ENTRYPOINT ["/usr/local/bin/docker-pre-start.sh"]
CMD ["node", "./dist/server/entry.mjs"]

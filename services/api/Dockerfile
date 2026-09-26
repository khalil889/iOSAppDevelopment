# Build from the repo root (npm workspaces share one lockfile):
#   docker build -f services/api/Dockerfile -t tourguide-api .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY apps/admin/package.json apps/admin/
RUN npm ci -w services/api --include-workspace-root=false
COPY services/api services/api
RUN npm run build -w services/api \
 && npm prune --omit=dev -w services/api --include-workspace-root=false

FROM node:22-alpine
ENV NODE_ENV=production PORT=3000 LOG_FORMAT=json
WORKDIR /app
COPY --from=build --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/services/api/package.json ./package.json
COPY --from=build --chown=node:node /repo/services/api/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health/live || exit 1
CMD ["node", "dist/main.js"]

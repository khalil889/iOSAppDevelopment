# Build from the repo root:
#   docker build -f apps/admin/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api -t tourguide-admin .
# NEXT_PUBLIC_* values are compiled into the bundle, so they are build args.
FROM node:22-alpine AS build
WORKDIR /repo
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ARG NEXT_PUBLIC_DEMO_HINT=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_DEMO_HINT=$NEXT_PUBLIC_DEMO_HINT \
    NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY apps/admin/package.json apps/admin/
RUN npm ci -w apps/admin --include-workspace-root=false
COPY apps/admin apps/admin
RUN npm run build -w apps/admin

FROM node:22-alpine
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/admin/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/admin/.next/static ./apps/admin/.next/static
USER node
EXPOSE 3001
CMD ["node", "apps/admin/server.js"]

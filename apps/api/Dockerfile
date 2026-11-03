FROM docker.io/library/node:24-slim AS base
WORKDIR /app

FROM base AS manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/

FROM manifests AS build
RUN npm ci
COPY tsconfig.base.json ./
COPY packages/core packages/core
COPY apps/api apps/api
RUN npm run build --workspace=@zenith/api

FROM manifests AS runtime
ENV NODE_ENV=production
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
RUN npm ci --omit=dev --workspace=@zenith/api \
 && npm cache clean --force
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/drizzle apps/api/drizzle
USER node
CMD ["node", "apps/api/dist/server.js"]

FROM docker.io/library/node:26-slim AS base
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

FROM manifests AS deps
ENV NODE_ENV=production
RUN node -e "for (const f of ['package.json','apps/api/package.json','packages/core/package.json']) { const p = JSON.parse(fs.readFileSync(f)); delete p.devDependencies; fs.writeFileSync(f, JSON.stringify(p)); }" \
 && npm install --omit=dev --workspace=@zenith/api \
 && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && apt-get install -y --only-upgrade libc6 libc-bin zlib1g \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=deps /app ./
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/drizzle apps/api/drizzle
USER node
CMD ["node", "apps/api/dist/server.js"]

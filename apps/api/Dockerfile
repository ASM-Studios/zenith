FROM docker.io/library/node:24-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530 AS base
WORKDIR /app

FROM base AS manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/weather/package.json packages/weather/

FROM manifests AS build
RUN npm ci
COPY tsconfig.base.json ./
COPY packages/core packages/core
COPY packages/weather packages/weather
COPY apps/api apps/api
RUN npm run build --workspace=@zenith/api

FROM manifests AS deps
ENV NODE_ENV=production
RUN node -e "for (const f of ['package.json','apps/api/package.json','packages/core/package.json','packages/weather/package.json']) { const p = JSON.parse(fs.readFileSync(f)); delete p.devDependencies; fs.writeFileSync(f, JSON.stringify(p)); }" \
 && npm install --omit=dev --workspace=@zenith/api \
 && npm cache clean --force

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:39b0407357c9fadf1a9708d22088f02de21f0e1e8a688474eea2d8701e7d5693 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app ./
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/packages/weather/dist packages/weather/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/drizzle apps/api/drizzle
CMD ["apps/api/dist/server.js"]

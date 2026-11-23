FROM docker.io/library/node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=@zenith/web --include-workspace-root
COPY tsconfig.base.json ./
COPY apps/web apps/web
RUN npm run build --workspace=@zenith/web

FROM docker.io/nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

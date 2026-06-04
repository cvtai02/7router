FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /workspace

# Install deps (layer cached until manifests change)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY ui/package.json ui/tsconfig.json ui/vite.config.ts ui/index.html ./ui/
COPY ui/src ./ui/src/
RUN pnpm install --frozen-lockfile --filter @7router/ui...

# Build
RUN pnpm --filter @7router/ui build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /workspace/ui/dist /usr/share/nginx/html
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

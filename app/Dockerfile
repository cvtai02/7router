FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /workspace

# Install deps (layer cached until manifests change)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY app/package.json app/tsconfig.json ./app/
COPY app/prisma ./app/prisma/
RUN pnpm install --frozen-lockfile

# Build
COPY app/src ./app/src/
RUN pnpm --filter @7router/app exec prisma generate
RUN pnpm --filter @7router/app build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /workspace
ENV NODE_ENV=production

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/app/dist ./app/dist
COPY --from=builder /workspace/app/prisma ./app/prisma
COPY app/package.json ./app/package.json

WORKDIR /workspace/app
EXPOSE 20131
CMD ["node", "dist/main.js"]

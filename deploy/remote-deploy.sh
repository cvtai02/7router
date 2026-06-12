#!/usr/bin/env bash
# Runs ON THE VPS via the SSH deploy workflow (piped to `bash -s`).
# Pulls latest main, installs, migrates, rebuilds, and reloads the pm2 API process.
set -euo pipefail

# A non-interactive SSH shell sources no profile — make sure node/pnpm/pm2 are found.
export PATH="$HOME/.local/share/pnpm:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
corepack enable pnpm >/dev/null 2>&1 || true

cd "$HOME/7router"
git fetch origin main
git reset --hard origin/main      # app/.env is gitignored, so it's never touched

# Install only the app workspace and its deps.
pnpm install --frozen-lockfile --filter @7router/app...

# Prisma: generate client, then apply pending migrations to the database.
# (7router does not migrate on boot — the deploy is the migration gate.)
pnpm --filter @7router/app exec prisma generate
pnpm --filter @7router/app exec prisma migrate deploy

pnpm --filter @7router/app build  # -> app/dist/main.js

cd app
pm2 reload 7router-api --update-env || pm2 start ecosystem.config.js
pm2 save

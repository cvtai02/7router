#!/bin/bash
set -euo pipefail

# ── Required env vars (injected by GitHub Actions) ───────────────────────────
: "${GHCR_USERNAME:?}"
: "${GHCR_PASSWORD:?}"
: "${GHCR_REGISTRY:?}"
: "${GHCR_API_IMAGE:?}"
: "${GHCR_UI_IMAGE:?}"

# ── Runtime env vars (set these on the VM, e.g. in ~/.deploy/.env) ───────────
ENV_FILE="${HOME}/deploy/.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  set -a; source "$ENV_FILE"; set +a
fi

: "${SYSTEM_SECRET:?SYSTEM_SECRET must be set in ~/deploy/.env}"
: "${DATABASE_URL:?DATABASE_URL must be set in ~/deploy/.env}"

# ── Config ───────────────────────────────────────────────────────────────────
API_CONTAINER="7router-api"
UI_CONTAINER="7router-ui"
API_PORT="${API_PORT:-20131}"
UI_PORT="${UI_PORT:-80}"
DATA_DIR="${HOME}/deploy/data"

mkdir -p "$DATA_DIR"

echo ">>> Logging in to ${GHCR_REGISTRY}"
echo "$GHCR_PASSWORD" | docker login "$GHCR_REGISTRY" -u "$GHCR_USERNAME" --password-stdin

echo ">>> Pulling images"
docker pull "$GHCR_API_IMAGE"
docker pull "$GHCR_UI_IMAGE"

echo ">>> Stopping old containers"
docker stop "$API_CONTAINER" 2>/dev/null || true
docker stop "$UI_CONTAINER" 2>/dev/null || true
docker rm   "$API_CONTAINER" 2>/dev/null || true
docker rm   "$UI_CONTAINER"  2>/dev/null || true

echo ">>> Starting API (port ${API_PORT})"
docker run -d \
  --name "$API_CONTAINER" \
  --restart unless-stopped \
  -p "${API_PORT}:20131" \
  -e NODE_ENV=production \
  -e SYSTEM_SECRET="$SYSTEM_SECRET" \
  -e DATABASE_URL="$DATABASE_URL" \
  -v "${DATA_DIR}:/data" \
  "$GHCR_API_IMAGE"

echo ">>> Starting UI (port ${UI_PORT})"
docker run -d \
  --name "$UI_CONTAINER" \
  --restart unless-stopped \
  -p "${UI_PORT}:80" \
  "$GHCR_UI_IMAGE"

echo ">>> Removing unused images"
docker image prune -f

echo ">>> Done"
docker ps --filter "name=7router"

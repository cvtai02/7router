# Handoff: Settings Migration to DB + Env

**Direction:** Backend → UI  
**Status:** Completed (implemented in this session)  
**Date:** 2026-06-04

## What Changed

### Backend

- `GET /settings` now returns `SystemConfig` instead of the old `RuntimeSettings` JSON blob:
  ```json
  {
    "providers": {
      "cloudflareR2": { "enabled": true },
      "googleDrive": { "enabled": true }
    },
    "features": { "manualSync": true }
  }
  ```
- `PUT /settings` accepts a partial `SystemConfig` and writes to the DB.
- `POST /settings/reload` is now a no-op (returns `{ restartRequired: false }`); no longer reloads a file.
- `GET /settings/tokens` — `MaskedToken` shape now includes `id` (DB cuid) as a top-level field:
  ```json
  { "id": "clxxx", "name": "my-token", "value": "abc12345.••••••••", "permissions": [...] }
  ```
- `DELETE /settings/tokens/:id` — `:id` is now the DB cuid from `MaskedToken.id` (was the value prefix).
- `POST /settings/tokens/:id/permissions` — same, `:id` is DB cuid.
- `DELETE /settings/tokens/:id/permissions/:index` — same, `:id` is DB cuid.
- Bootstrap settings (admin token, encryption key, port) moved from `settings.local.json` to `app/.env`.
- Access tokens moved from JSON file to `AccessToken` DB table.

### UI

- `SettingsPage` replaced raw JSON editor with structured toggles for provider and feature flags.
- `AccessTokensPage` updated to use `token.id` for revoke and permission mutations.
- `ui/src/api/client.ts` rewritten with native fetch; `@7router/api-clients` dependency removed.
- All types (`MaskedToken`, `TokenPermission`, `SystemConfig`) now exported from `ui/src/api/client.ts`.

## Migration for Existing Users

Users who had `app/settings.local.json` must:
1. Copy `app/.env.example` to `app/.env`
2. Set `SYSTEM_TOKEN` to their previous `auth.adminToken` value
3. Set `ENCRYPTION_KEY_BASE64` to their previous `encryption.keyBase64` value
4. Run `pnpm --filter @7router/app prisma:push` to add the new `AppSetting` and `AccessToken` tables
5. Re-add access tokens via the UI (they are not migrated automatically)

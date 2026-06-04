# App

NestJS backend for `7router`.

- `src/core`: provider enum, shared provider contract, and absolute path parser.
- `src/infrastructure/settings`: DB-backed system config (provider flags, feature flags) and DB-backed access token management. Bootstrap settings (system token, encryption key) come from env vars.
- `src/infrastructure/database`: Prisma context. Seeds provider records and default AppSettings on startup.
- `src/infrastructure/encryption`: AES-256-GCM credential encryption; key from `ENCRYPTION_KEY_BASE64` env var.
- `src/infrastructure/providers`: Cloudflare R2 and Google Drive adapters implementing `IProvider`.
- `src/modules`: single-route `*.api.ts` handlers, one DTO/type per file, and one use case per file for auth, settings, providers, accounts, files, and sync.
- `prisma/schema.prisma`: SQLite schema for Provider → Account → Bucket → Key, SyncRun, AppSetting, and AccessToken.

Bootstrap setup (copy `app/.env.example` → `app/.env` and fill in values):

```bash
cp .env.example .env
# Edit .env: set SYSTEM_TOKEN, ENCRYPTION_KEY_BASE64, DATABASE_URL
pnpm install
pnpm --filter @7router/app prisma:generate
pnpm --filter @7router/app prisma:push
pnpm dev
```

Runtime settings (provider enabled flags, feature flags) are stored in the `AppSetting` DB table and editable from the System Config page in the UI.

Access tokens are stored in the `AccessToken` DB table. The admin token comes from `SYSTEM_TOKEN` in `.env`.

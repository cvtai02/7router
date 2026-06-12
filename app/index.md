# App

NestJS backend for `7router`.

- `src/core`: provider enum, shared provider contract, absolute path parser, and access token hashing.
- `src/infrastructure/settings`: DB-backed system config (provider flags, feature flags, Google Drive OAuth config) and DB-backed access token management. Bootstrap settings (system secret, encryption key) come from env vars.
- `src/infrastructure/database`: Prisma context. Seeds provider records and default AppSettings on startup.
- `src/infrastructure/encryption`: AES-256-GCM credential encryption; key is `SHA-256(ENCRYPTION_KEY)` from the `ENCRYPTION_KEY` env var.
- `src/infrastructure/providers`: Cloudflare R2 and Google Drive adapters implementing `IProvider`.
- `src/modules`: single-route `*.api.ts` handlers, one DTO/type per file, and one use case per file for auth, settings, providers, accounts, files, and sync.
- `prisma/schema.prisma`: PostgreSQL schema for Provider → Account → Bucket → Key, SyncRun, AppSetting, GoogleSetting, and AccessToken. Schema changes go through `prisma/migrations/`.

Bootstrap setup (copy `app/.env.example` → `app/.env` and fill in values):

```bash
cp .env.example .env
# Edit .env: set SYSTEM_SECRET, ENCRYPTION_KEY, DATABASE_URL (PostgreSQL)
pnpm install
pnpm --filter @7router/app prisma:generate
pnpm --filter @7router/app prisma:migrate
pnpm dev
```

Runtime settings (provider enabled flags, feature flags, Google Drive OAuth config) are stored in the `AppSetting` and `GoogleSetting` DB tables and editable from the System Config page in the UI.

Access tokens are stored encrypted at rest in the `AccessToken` DB table (AES-256-GCM value plus SHA-256 lookup hash; legacy plaintext rows are converted on startup). The admin credential comes from `SYSTEM_SECRET` in `.env`.

# App

NestJS backend for `7router`.

- `src/core`: provider enum, shared provider contract, and absolute path parser.
- `src/infrastructure/settings`: JSON runtime settings loader and safe masked updates.
- `src/infrastructure/database`: Prisma context.
- `src/infrastructure/encryption`: AES-256-GCM credential encryption.
- `src/infrastructure/providers`: Cloudflare R2 and Google Drive adapters implementing `IProvider`.
- `src/modules`: single-route `*.api.ts` handlers, one DTO/type per file, and one use case per file for auth, settings, providers, accounts, files, and sync.
- `prisma/schema.prisma`: SQLite schema for Provider -> Account -> Bucket -> Key and sync runs.

Run locally without Docker:

```bash
pnpm install
pnpm --filter @7router/app prisma:generate
pnpm --filter @7router/app prisma:push
pnpm --filter @7router/app dev
```

Default local API token is `dev-local-token` in ignored `settings.local.json`.

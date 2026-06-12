# App Rules

- All protected routes require `Authorization: Bearer <token>`.
- The system secret is read from `process.env.SYSTEM_SECRET`; access tokens are stored encrypted at rest in the `AccessToken` DB table with a SHA-256 hash for lookups.
- Controllers call use cases and do not contain business logic.
- API route handlers use one `*.api.ts` file per route.
- Use cases use one class per file.
- DTOs use one DTO/type per file. Barrel files may only re-export.
- Use cases may depend directly on `PrismaService`.
- Do not add a repository layer above Prisma. Prisma is the database adapter; adapter-based infrastructure applies to non-ORM services (storage, email).
- Provider adapters must implement `IProvider`.
- Provider credentials are encrypted before persistence and decrypted only in infrastructure.
- Bootstrap settings (system secret, encryption key, database URL) come from env vars, not the database.
- Runtime settings (provider flags, feature flags) are stored in `AppSetting` and editable via the settings API.
- API errors use the NestJS default error shape `{ statusCode, message, error }` across all endpoints.
- All schema changes go through Prisma migrations committed in the same change set; never edit the database schema manually.
- Keep OpenAPI generated at `src/generated/openapi.json` when the app starts.
- CORS allows all origins, methods, and headers. Acceptable because auth is bearer-header based, not cookie based.

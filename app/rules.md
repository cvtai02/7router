# App Rules

- All protected routes require `Authorization: Bearer <token>`.
- The system token is read from `process.env.SYSTEM_TOKEN`; access tokens are stored in the `AccessToken` DB table.
- Controllers call use cases and do not contain business logic.
- API route handlers use one `*.api.ts` file per route.
- Use cases use one class per file.
- DTOs use one DTO/type per file. Barrel files may only re-export.
- Use cases may depend directly on `PrismaService`.
- Do not add a repository layer above Prisma.
- Provider adapters must implement `IProvider`.
- Provider credentials are encrypted before persistence and decrypted only in infrastructure.
- Bootstrap settings (system token, encryption key, database URL) come from env vars, not the database.
- Runtime settings (provider flags, feature flags) are stored in `AppSetting` and editable via the settings API.
- Keep OpenAPI generated at `src/generated/openapi.json` when the app starts.
- CORS allows all origins, methods, and headers.

# App Rules

- All protected routes require `Authorization: Bearer <access-token>`.
- Controllers call use cases and do not contain business logic.
- API route handlers use one `*.api.ts` file per route.
- Use cases use one class per file.
- DTOs use one DTO/type per file. Barrel files may only re-export.
- Use cases may depend directly on `PrismaService`.
- Do not add a repository layer above Prisma.
- Provider adapters must implement `IProvider`.
- Provider credentials are encrypted before persistence and decrypted only in infrastructure.
- `settings.local.json` is local-only and ignored.
- Keep DTO changes mirrored in `api-clients/src/dtos`.
- Keep OpenAPI generated at `src/generated/openapi.json` when the app starts.

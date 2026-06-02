# API Client Rules

- Do not import NestJS or backend runtime code.
- Use native `fetch`; callers may inject a compatible `fetchImpl`.
- Send protected API tokens with `Authorization: Bearer <token>`.
- Keep DTOs synced with backend contract changes.
- Keep DTOs as one DTO/type per file. `src/dtos/index.ts` may only re-export.
- Keep this package portable and publishable.

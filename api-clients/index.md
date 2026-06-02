# API Clients

Portable TypeScript clients for the `7router` API.

- Uses native `fetch` only.
- DTOs are mirrored from `app/src/modules/*/dtos` and `app/src/core/contracts`, with one DTO/type per file.
- Client classes live in `src/clients`.
- `SevenRouterClientOptions` accepts `baseUrl`, optional `accessToken`, and optional `fetchImpl`.

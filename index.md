# 7router

`7router` manages multiple cloud storage providers and accounts through one API and web UI.

Top-level folders:

- `app/`: NestJS API, Prisma schema, provider adapters, settings, auth, sync, and OpenAPI output.
- `ui/`: React + Vite web UI for token login, provider/account setup, browsing, sync, synced files, and settings.
- `api-clients/`: portable TypeScript clients using native `fetch`.
- `api-mcp-server/`: local automation and smoke-test scripts that call the API through `api-clients`.
- `handoffs/`: API/UI handoffs. Active backend-to-UI notes live in `handoffs/backend-to-ui/`; completed handoffs move to `handoffs/archive/`.

Navigation:

- API contracts and DTOs live in `app/src/modules/*/dtos` and are mirrored in `api-clients/src/dtos`.
- Provider contracts, enums, and path parsing live in `app/src/core`.
- Provider adapters live in `app/src/infrastructure/providers`.
- Runtime settings live in `app/settings.example.json` and ignored `app/settings.local.json`.
- UI pages live in `ui/src/pages`.


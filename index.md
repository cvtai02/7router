# 7router

`7router` manages multiple cloud storage providers and accounts through one API and web UI.

Top-level folders:

- `app/`: NestJS API, Prisma schema, provider adapters, auth, sync, and OpenAPI output.
- `ui/`: React + Vite web UI for token login, provider/account setup, browsing, sync, synced files, and system config.
- `handoffs/`: API/UI handoffs. Active notes live here; completed handoffs move to `handoffs/archive/`.

Navigation:

- API contracts and DTOs live in `app/src/modules/*/dtos`.
- Provider contracts, enums, and path parsing live in `app/src/core`.
- Provider adapters live in `app/src/infrastructure/providers`.
- Bootstrap settings (system token, database URL, encryption key) live in `app/.env`.
- Runtime settings (provider flags, feature flags) are stored in the database and editable from the System Config page.
- UI pages live in `ui/src/pages`.

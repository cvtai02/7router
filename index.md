# 7router

`7router` manages multiple cloud storage providers and accounts through one API and web UI.

Top-level folders:

- `app/`: NestJS API, Prisma schema, provider adapters, auth, sync, and OpenAPI output.
- `ui/`: React + Vite web UI for token login, provider/account setup, browsing, sync, synced files, and system config.
- `handoffs/`: API/UI handoffs in `backend-to-ui/` and `ui-to-backend/`. Completed handoffs move to the `archive/` folder inside their direction folder.
- `AGENTS.md` / `CLAUDE.md`: agent instructions; both require reading `index.md` and `rules.md` first.

Navigation:

- API contracts and DTOs live in `app/src/modules/*/dtos`.
- Provider contracts, enums, and path parsing live in `app/src/core`.
- Provider adapters live in `app/src/infrastructure/providers`.
- Bootstrap settings (system secret, encryption key, database URL) live in `app/.env`.
- Runtime settings (provider flags, feature flags) are stored in the database and editable from the System Config page.
- UI pages live in `ui/src/pages`.

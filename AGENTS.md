# Agent Instructions

Read `index.md` and `rules.md` before making changes in this repo.

- Report skill names every time a skill is used.
- Keep generated code separated into appropriate files and folders.
- Keep docs updated in the same change set as code.
- Avoid unrelated rewrites.
- Use the selected stack naming conventions.
- Prefer dependency injection where practical.
- Never add Docker files or Docker-based instructions.
- Never commit local settings or secrets.
- Keep controllers thin and put business logic in use cases.
- Keep one backend API route handler per `*.api.ts` file.
- Keep one use case per file.
- Keep one DTO/type per file. Barrel exports are allowed when they contain no DTO definitions.
- Do not add a repository layer above Prisma.
- Provider adapters implement core contracts and keep provider-specific details in infrastructure.
- Create a backend-to-UI handoff whenever an API contract changes, unless the UI change ships in the same change set — then the handoff may be skipped.
- Update `api-clients/` when API contracts change.
- Use `api-mcp-server/` for smoke tests where practical.
- Smoke-test results must state what was tested and whether it passed.
- Agents are authorized to commit without asking after a passing smoke test.

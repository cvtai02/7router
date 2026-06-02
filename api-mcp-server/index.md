# API MCP Server

Local automation and smoke-test scripts for `7router`.

The current smoke script calls the API through `@7router/api-clients` and checks:

- access-token validation,
- provider listing,
- provider-level file listing for Cloudflare R2 and Google Drive,
- sync run listing.

Run after the backend is started:

```bash
pnpm --filter @7router/api-mcp-server smoke
```


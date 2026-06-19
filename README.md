# 7router

A self-hosted storage gateway that unifies multiple cloud storage providers (Cloudflare R2, Google Drive) behind a single API and admin UI.

## Overview

7router lets you manage cloud storage accounts, browse files, sync metadata to a local database, and expose a token-gated API for external clients to upload files and query storage data.

## Packages

| Package | Description |
|---|---|
| `app` | NestJS API server |
| `ui` | React admin UI (Vite) |
| `api-clients` | TypeScript client SDK |
| `api-mcp-server` | MCP server for AI tool access |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
pnpm install
```

Copy the example settings and fill in your values:

```bash
cp app/settings.example.json app/settings.local.json
```

`settings.local.json` fields:

```json
{
  "server": { "port": 20131, "corsOrigins": ["*"] },
  "auth": {
    "adminToken": "<your-admin-password>",
    "accessTokens": []
  },
  "database": { "url": "file:../dev.db" },
  "encryption": { "keyBase64": "<32-byte base64 key>" }
}
```

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Run

Build the API and start both services:

```bash
# Build
pnpm --filter @7router/api-clients build
pnpm --filter @7router/app build

# Start API (port 20131)
cd app && node dist/main.js

# Start UI (port 20132)
pnpm --filter @7router/ui dev
```

## Admin UI

Open `http://localhost:20132` and sign in with your `adminToken`.

- **Browser** — navigate storage, create folders/buckets, trigger sync
- **Providers** — add/remove Cloudflare R2 and Google Drive accounts
- **Access Tokens** — create named API tokens with per-path permissions
- **Settings** — edit runtime config
- **Use Cases** — API documentation for external clients

### Google Drive OAuth

To connect Google Drive accounts from the Accounts page, save your Google OAuth client ID and client secret in **Settings**. The API stores those values in SQLite and encrypts the client secret.

Use this redirect URI in Google Cloud Console:

```text
http://localhost:20131/providers/GoogleDrive/accounts/oauth/callback
```

For a VPS deployment, use the same callback path on your API domain.

## Client API

External clients authenticate with a Bearer token created in the Access Tokens page. Each token has explicit path permissions (`read`, `write`, or `read-write`).

```
Authorization: Bearer <tokenId>.<secret>
```

### Endpoints

All endpoints use `POST` with a JSON body.

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/files/list` | read | List files at a path |
| `POST` | `/files/download` | read | Download file bytes |
| `POST` | `/files/temp-download-url` | read | Create a temporary direct download URL |
| `POST` | `/files/temp-upload-url` | write | Create a temporary direct upload URL |
| `POST` | `/files/upload` | write | Upload a file |

#### List files

```bash
curl -X POST http://localhost:20131/files/list \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"path": "CloudflareR2/my-account/my-bucket"}'
```

Response includes synced metadata for each item.

#### Download file

```bash
curl -X POST http://localhost:20131/files/download \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"absolutePath": "CloudflareR2/my-account/my-bucket/photo.jpg"}'
```

Response includes metadata plus `contentBase64` with the file bytes.

#### Temporary download URL

```bash
curl -X POST http://localhost:20131/files/temp-download-url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"absolutePath": "CloudflareR2/my-account/my-bucket/photo.jpg", "expiresInSeconds": 900}'
```

Response includes a temporary `GET` URL and its expiration timestamp. Cloudflare R2
uses a presigned object URL; Google Drive uses a Drive media URL with a short-lived
OAuth access token.

#### Temporary upload URL

```bash
curl -X POST http://localhost:20131/files/temp-upload-url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"absolutePath": "CloudflareR2/my-account/my-bucket/photo.jpg", "contentType": "image/jpeg", "expiresInSeconds": 900}'
```

Response includes a temporary `PUT` URL, required headers, and its expiration timestamp.
Cloudflare R2 uses a presigned object URL; Google Drive uses a resumable upload
session URL. Files uploaded through the temporary URL bypass the API server, so
run sync to refresh local metadata after the direct upload completes.

#### Upload file

```bash
curl -X POST http://localhost:20131/files/upload \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "absolutePath": "CloudflareR2/my-account/my-bucket/photo.jpg",
    "contentBase64": "<base64>",
    "contentType": "image/jpeg"
  }'
```

### Path format

```
<Provider>/<account>/<bucket>[/<folder>/<filename>]
```

Supported providers: `CloudflareR2`, `GoogleDrive`.

### Token permissions

Tokens only access paths they have been granted. Configure permissions in the admin UI under **Access Tokens**.

```json
{ "path": "CloudflareR2/my-account/my-bucket", "access": "read-write" }
```

A token with `read-write` on `CloudflareR2/account/bucket` can access any path under that bucket.

## Data flow

File metadata is **not** fetched live from providers. Instead:

1. Run a **Sync** from the Browser page (or `POST /sync`) to crawl the provider and write metadata to the local SQLite database.
2. `POST /files/list` reads from the database.

This means listings are always fast and offline-capable, but require a sync to stay up to date.

## Supported Providers

| Provider | List | Get | Upload | Create Folder | CDN URL |
|---|---|---|---|---|---|
| Cloudflare R2 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Google Drive | ✓ | ✓ | ✓ | ✓ | — |

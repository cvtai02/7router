# 7router — Codex/Claude Project Setup Plan

Generated: 2026-06-02
Project name: `7router`
Primary purpose: manage multiple cloud storage providers and accounts through a unified API and web UI.

This file is intended to be given directly to Codex, Claude, or another coding agent to create the initial project structure, documentation, backend, UI, API clients, and smoke-testable implementation.

---

## 1. Confirmed Requirements

### 1.1 Product scope

`7router` is a cloud storage management application.

It must support multiple cloud storage providers through a unified provider interface.

Initial provider enum values:

```ts
export enum ProviderName {
  CloudflareR2 = "CloudflareR2",
  GoogleDrive = "GoogleDrive",
}
```

The app must allow the user to:

- Add accounts for each provider.
- Remove accounts for each provider.
- List folders and files across providers.
- Retrieve files by absolute path.
- Manually sync file paths into the database.
- Use a web UI to configure providers, accounts, settings, and access tokens.

### 1.2 Authentication

Use access-token authentication.

Requirements:

- The app API must require an access token for protected endpoints.
- Access tokens must be configured through runtime settings.
- Access tokens are used during early login/authentication flows in the UI.
- Do not implement username/password authentication unless explicitly requested later.
- Do not implement OAuth login for the app itself unless explicitly requested later.

Provider-specific OAuth/API tokens may still be needed for Google Drive and R2 account connections.
Those provider credentials must be stored encrypted.

### 1.3 UI

Include a web UI.

The UI must support:

- Entering and storing the app access token locally for API calls.
- Viewing configured providers.
- Adding/removing provider accounts.
- Browsing provider/account/bucket/folder/file paths.
- Triggering manual sync for an absolute path.
- Viewing synced provider/account/bucket/key records.
- Viewing and editing runtime settings where safe.

### 1.4 Sync

Sync is manual only.

Sync receives an absolute path as a parameter.

Absolute path format:

```text
<ProviderName>/<AccountName>/<Bucket or Folder>/<Key or file path>
```

Examples:

```text
CloudflareR2/main-account/assets/images/logo.png
GoogleDrive/work-drive/My Drive/contracts/client-a.pdf
```

Sync must persist discovered file paths to the database using this logical hierarchy:

```text
Provider <-- Account <-- Bucket <-- Key
```

For Google Drive, map the hierarchy as:

```text
Provider = GoogleDrive
Account = connected Google account name
Bucket = top-level Drive root or shared drive name
Key = nested folder/file path or Drive file id-backed path
```

For Cloudflare R2, map the hierarchy as:

```text
Provider = CloudflareR2
Account = configured R2 account name
Bucket = R2 bucket name
Key = object key
```

### 1.5 Providers required in first implementation

Implement both providers in the initial version:

- Cloudflare R2
- Google Drive

Do not stub Google Drive only. Both providers must have usable adapters, account configuration, listing, file retrieval, and manual sync support.

### 1.6 Infrastructure constraint

Do not use Docker.

All setup commands must work directly on the local machine with Node.js, pnpm, and the selected database runtime.

---

## 2. Selected Tech Stack

Use this stack unless the project owner changes it later.

### 2.1 Monorepo tooling

- Language: TypeScript
- Package manager: pnpm
- Workspace: pnpm workspaces
- Runtime: Node.js LTS
- Formatting: Prettier
- Linting: ESLint
- Testing: Vitest

### 2.2 Backend app

- Framework: NestJS
- ORM: Prisma
- Default local database: SQLite
- Database file: configured through ignored JSON settings
- API documentation: OpenAPI/Swagger
- Auth: access-token guard
- Encryption: Node.js `crypto` module using AES-256-GCM

Reasoning:

- SQLite keeps setup simple because Docker is not allowed.
- Prisma keeps the data model explicit and migratable.
- The rules forbid adding a repository layer above the ORM, so use cases may depend directly on Prisma context.
- The database config must still be stored in ignored runtime settings so PostgreSQL can be introduced later without changing business logic.

### 2.3 UI

- Framework: React + Vite
- Language: TypeScript
- API access: generated/portable client from `api-clients/`
- State/data fetching: TanStack Query
- Forms: React Hook Form + Zod
- Routing: React Router

### 2.4 API clients

- TypeScript package under `api-clients/`
- Must use native `fetch`
- Must expose interfaces and implementations
- DTOs must be synced from `app/`
- Must be portable and publishable as an npm package later

### 2.5 Local automation / MCP server

- `api-mcp-server/` should be a local TypeScript service/script package.
- Use it for smoke testing, mock data, dirty data repair, and local automation.
- It should call the app API through `api-clients/` where possible.

---

## 3. Mandatory Root Structure

Create this exact root structure:

```text
7router/
├── app/
├── ui/
├── handoffs/
│   └── archive/
├── api-clients/
├── api-mcp-server/
├── index.md
├── rules.md
└── agents-instructions.md
```

Also create these handoff subfolders:

```text
handoffs/
├── backend-to-ui/
├── ui-to-backend/
└── archive/
```

### 3.1 Root file purposes

`index.md` must explain:

- What `7router` does.
- What each top-level folder contains.
- How agents should navigate the project.
- Where API contracts, DTOs, provider adapters, settings, and UI pages live.

`rules.md` must include:

- The project rules from the supplied `AnyProjectRules.md` result.
- The no-Docker constraint.
- The access-token auth constraint.
- The provider interface and path format constraints.
- Documentation update requirements.

`agents-instructions.md` must include:

- How Codex/Claude should work in this repo.
- Required skill reporting behavior.
- Required documentation update behavior.
- Required handoff behavior when API contracts change.
- Testing and smoke test expectations.

---

## 4. App Structure

Create the backend app under `app/`.

Recommended structure:

```text
app/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── core/
│   │   ├── enums/
│   │   ├── contracts/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── policies/
│   │   └── value-objects/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── encryption/
│   │   ├── settings/
│   │   └── providers/
│   │       ├── cloudflare-r2/
│   │       └── google-drive/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── usecases/
│   │   │   ├── controllers/
│   │   │   └── dtos/
│   │   ├── settings/
│   │   │   ├── usecases/
│   │   │   ├── controllers/
│   │   │   └── dtos/
│   │   ├── providers/
│   │   │   ├── usecases/
│   │   │   ├── controllers/
│   │   │   └── dtos/
│   │   ├── accounts/
│   │   │   ├── usecases/
│   │   │   ├── controllers/
│   │   │   └── dtos/
│   │   ├── files/
│   │   │   ├── usecases/
│   │   │   ├── controllers/
│   │   │   └── dtos/
│   │   └── sync/
│   │       ├── usecases/
│   │       ├── controllers/
│   │       └── dtos/
│   └── generated/
│       └── openapi.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── settings.example.json
├── settings.local.json
├── package.json
├── tsconfig.json
├── index.md
└── rules.md
```

Important:

- `settings.local.json` must be listed in `.gitignore`.
- `settings.example.json` may be committed with safe placeholder values.
- Do not place provider credentials in source code.
- Do not place provider credentials in committed docs except as placeholders.

---

## 5. Core / Shared Kernel

Create shared definitions under:

```text
app/src/core/
```

### 5.1 Provider enum

Create:

```text
app/src/core/enums/provider-name.enum.ts
```

```ts
export enum ProviderName {
  CloudflareR2 = "CloudflareR2",
  GoogleDrive = "GoogleDrive",
}
```

### 5.2 Provider contract

Create:

```text
app/src/core/contracts/provider.contract.ts
```

Use this conceptual contract:

```ts
import { ProviderName } from "../enums/provider-name.enum";

export interface ProviderListItemDto {
  name: string;
  absolutePath: string;
  type: "provider" | "account" | "bucket" | "folder" | "file";
  providerName: ProviderName;
  accountName?: string;
  bucketOrRootName?: string;
  keyOrPath?: string;
  sizeBytes?: number;
  contentType?: string;
  modifiedAt?: string;
}

export interface ProviderFileDto {
  absolutePath: string;
  providerName: ProviderName;
  accountName: string;
  bucketOrRootName: string;
  keyOrPath: string;
  contentType?: string;
  sizeBytes?: number;
  contentBase64?: string;
  downloadUrl?: string;
}

export interface AddProviderAccountDto {
  providerName: ProviderName;
  accountName: string;
  credentials: Record<string, unknown>;
}

export interface RemoveProviderAccountDto {
  providerName: ProviderName;
  accountName: string;
}

export interface IProvider {
  readonly providerName: ProviderName;

  /**
   * Lists subfolders and files for the current path.
   * If currentPath is exactly the provider name, return accounts for that provider.
   */
  listSubFolderAndFile(currentPath: string): Promise<ProviderListItemDto[]>;

  addAccount(input: AddProviderAccountDto): Promise<void>;

  removeAccount(input: RemoveProviderAccountDto): Promise<void>;

  /**
   * absolutePath format:
   * <ProviderName>/<AccountName>/<Bucket or Folder>/<Key or file path>
   */
  getFile(absolutePath: string): Promise<ProviderFileDto>;
}
```

### 5.3 Path parser

Create a shared path parser/value object:

```text
app/src/core/value-objects/provider-absolute-path.ts
```

Responsibilities:

- Parse absolute paths.
- Validate provider names.
- Validate account segment.
- Validate bucket/root segment when required.
- Preserve the remaining key/file path exactly.
- Provide structured output to use cases and adapters.

Expected parsed shape:

```ts
export interface ParsedProviderAbsolutePath {
  providerName: ProviderName;
  accountName?: string;
  bucketOrRootName?: string;
  keyOrPath?: string;
  originalPath: string;
}
```

Rules:

- `CloudflareR2` alone means provider level.
- `CloudflareR2/account-name` means account level.
- `CloudflareR2/account-name/bucket-name` means bucket level.
- `CloudflareR2/account-name/bucket-name/path/to/object.txt` means object level.
- `GoogleDrive` alone means provider level.
- `GoogleDrive/account-name` means account level.
- `GoogleDrive/account-name/My Drive` means Drive root/top-level folder level.
- `GoogleDrive/account-name/My Drive/path/to/file.txt` means nested file/folder level.

---

## 6. Database Model

Use Prisma.

Create a schema that supports the required hierarchy:

```text
Provider <-- Account <-- Bucket <-- Key
```

Recommended Prisma model names:

- `ProviderRecord`
- `ProviderAccount`
- `StorageBucket`
- `StorageKey`
- `SyncRun`
- `SettingAudit` optional

### 6.1 Prisma schema draft

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum ProviderName {
  CloudflareR2
  GoogleDrive
}

model ProviderRecord {
  id          String            @id @default(cuid())
  name        ProviderName      @unique
  displayName String
  accounts    ProviderAccount[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model ProviderAccount {
  id                   String          @id @default(cuid())
  providerId           String
  provider             ProviderRecord  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  accountName          String
  encryptedCredentials String
  credentialHint       String?
  buckets              StorageBucket[]
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  @@unique([providerId, accountName])
}

model StorageBucket {
  id          String          @id @default(cuid())
  accountId   String
  account     ProviderAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  name        String
  displayName String?
  keys        StorageKey[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@unique([accountId, name])
}

model StorageKey {
  id              String        @id @default(cuid())
  bucketId        String
  bucket          StorageBucket @relation(fields: [bucketId], references: [id], onDelete: Cascade)
  key             String
  absolutePath    String        @unique
  itemType        String
  sizeBytes       Int?
  contentType     String?
  providerFileId  String?
  checksum        String?
  modifiedAt      DateTime?
  lastSyncedAt    DateTime
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([bucketId, key])
}

model SyncRun {
  id             String   @id @default(cuid())
  absolutePath   String
  providerName   ProviderName
  accountName    String?
  bucketName     String?
  status         String
  discovered     Int      @default(0)
  inserted       Int      @default(0)
  updated        Int      @default(0)
  failed         Int      @default(0)
  errorMessage   String?
  startedAt      DateTime @default(now())
  completedAt    DateTime?
}
```

Notes:

- Keep provider account credentials encrypted in `ProviderAccount.encryptedCredentials`.
- `credentialHint` may store safe display-only metadata, such as masked email or account id.
- For Google Drive, `providerFileId` should store the Drive file id when available.
- For R2, `key` should store the object key.

---

## 7. Runtime Settings

Settings must be stored in JSON so they can be viewed and updated from the UI.

Create:

```text
app/settings.example.json
app/settings.local.json
```

`settings.local.json` must be ignored by git.

### 7.1 Example settings

```json
{
  "server": {
    "port": 3000,
    "corsOrigins": ["http://localhost:5173"]
  },
  "auth": {
    "accessTokens": ["replace-with-local-token"]
  },
  "database": {
    "url": "file:./dev.db"
  },
  "encryption": {
    "keyBase64": "replace-with-32-byte-base64-key"
  },
  "providers": {
    "cloudflareR2": {
      "enabled": true
    },
    "googleDrive": {
      "enabled": true
    }
  },
  "features": {
    "manualSync": true
  }
}
```

### 7.2 Settings rules

- Settings JSON must be the source of runtime configuration.
- Settings JSON must be editable through the UI where safe.
- Sensitive fields must be masked in UI responses.
- Changing settings through the UI may require app restart/reset.
- Never commit `settings.local.json`.
- Never log access tokens or provider credentials.

---

## 8. Encryption

Provider account credentials must be encrypted before persistence.

Create:

```text
app/src/infrastructure/encryption/credential-encryption.service.ts
```

Use AES-256-GCM.

Implementation requirements:

- Read encryption key from settings.
- Require 32-byte key after base64 decode.
- Generate a random IV per encryption operation.
- Store encrypted payload as a versioned string or JSON envelope.
- Include auth tag.
- Decrypt only inside infrastructure/provider account services.

Recommended encrypted envelope:

```ts
interface EncryptedSecretEnvelope {
  version: 1;
  algorithm: "aes-256-gcm";
  ivBase64: string;
  authTagBase64: string;
  ciphertextBase64: string;
}
```

---

## 9. Backend Modules and Use Cases

Follow this module structure for every module:

```text
module-name/
├── usecases/
├── controllers/
└── dtos/
```

Use cases contain business actions.
Controllers expose use cases.
DTOs are shared by controllers and use cases.
Do not duplicate DTOs.
Do not implement business logic inside controllers.
Do not create a repository layer above Prisma.
Use cases may depend directly on Prisma context.

### 9.1 Auth module

Path:

```text
app/src/modules/auth/
```

Responsibilities:

- Validate app access tokens.
- Expose token check endpoint.
- Provide NestJS guard for protected endpoints.

Endpoints:

```text
POST /auth/check-token
```

Request:

```ts
export interface CheckTokenRequestDto {
  accessToken: string;
}
```

Response:

```ts
export interface CheckTokenResponseDto {
  valid: boolean;
}
```

Auth behavior:

- Protected endpoints use `Authorization: Bearer <access-token>`.
- The UI stores the token in browser local storage or session storage.
- Do not send access token in query string.

### 9.2 Settings module

Path:

```text
app/src/modules/settings/
```

Endpoints:

```text
GET /settings
PUT /settings
POST /settings/reload
```

Requirements:

- `GET /settings` returns masked settings.
- `PUT /settings` updates editable settings.
- Sensitive values must be write-only or masked.
- `POST /settings/reload` reloads settings where possible and reports whether restart is required.

### 9.3 Providers module

Path:

```text
app/src/modules/providers/
```

Endpoints:

```text
GET /providers
GET /providers/:providerName
GET /providers/:providerName/accounts
```

Responsibilities:

- List available provider types.
- Show provider status.
- Return configured accounts for a provider.

### 9.4 Accounts module

Path:

```text
app/src/modules/accounts/
```

Endpoints:

```text
POST /providers/:providerName/accounts
DELETE /providers/:providerName/accounts/:accountName
```

Responsibilities:

- Add provider account.
- Remove provider account.
- Encrypt credentials.
- Persist account metadata.
- Delegate provider-specific validation to provider adapters.

### 9.5 Files module

Path:

```text
app/src/modules/files/
```

Endpoints:

```text
GET /files/list?path=<absolute-or-provider-path>
GET /files/get?absolutePath=<absolute-path>
```

Responsibilities:

- Route list/get requests to the correct provider adapter.
- Parse and validate absolute paths.
- Return normalized DTOs.

Special rule:

When `currentPath` is exactly the provider name, `listSubFolderAndFile(currentPath)` must return accounts for that provider.

Examples:

```text
GET /files/list?path=CloudflareR2
GET /files/list?path=GoogleDrive
```

Both return account-like items.

### 9.6 Sync module

Path:

```text
app/src/modules/sync/
```

Endpoint:

```text
POST /sync
```

Request:

```ts
export interface SyncRequestDto {
  absolutePath: string;
}
```

Response:

```ts
export interface SyncResponseDto {
  syncRunId: string;
  absolutePath: string;
  status: "Completed" | "Failed";
  discovered: number;
  inserted: number;
  updated: number;
  failed: number;
  errorMessage?: string;
}
```

Responsibilities:

- Parse the absolute path.
- Resolve the provider adapter.
- List files recursively from the requested path.
- Persist provider/account/bucket/key records.
- Create a `SyncRun` record.
- Return sync statistics.

Manual only:

- Do not add background scheduled sync.
- Do not add cron jobs.
- Do not add queues unless explicitly requested later.

---

## 10. Provider Adapters

Infrastructure implementations must live under:

```text
app/src/infrastructure/providers/
```

Provider adapters must implement `IProvider` from the core/shared kernel.

Infrastructure implementations must not leak provider-specific details into use cases or controllers.

### 10.1 Cloudflare R2 adapter

Path:

```text
app/src/infrastructure/providers/cloudflare-r2/
```

Use AWS SDK S3-compatible client.

Account credential input should support:

```ts
export interface CloudflareR2CredentialsDto {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  region?: string;
}
```

Default endpoint format:

```text
https://<accountId>.r2.cloudflarestorage.com
```

Required operations:

- Add account: validate credentials by listing buckets.
- Remove account: delete account metadata and encrypted credentials.
- List provider path: return accounts.
- List account path: return buckets.
- List bucket/path: return folder-like prefixes and files/objects.
- Get file: retrieve object content or signed download URL.
- Sync: recursively list objects under bucket/prefix and persist paths.

Path examples:

```text
CloudflareR2/main
CloudflareR2/main/my-bucket
CloudflareR2/main/my-bucket/images/logo.png
```

### 10.2 Google Drive adapter

Path:

```text
app/src/infrastructure/providers/google-drive/
```

Use Google Drive API client.

Account credential input should support an access token and optional refresh token/client credentials if available:

```ts
export interface GoogleDriveCredentialsDto {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  tokenExpiryIso?: string;
  accountEmail?: string;
}
```

Required operations:

- Add account: validate credentials by calling Drive `about` or listing files.
- Remove account: delete account metadata and encrypted credentials.
- List provider path: return accounts.
- List account path: return Drive roots/shared drives as bucket/root-like items.
- List root/folder path: return folders and files.
- Get file: download file content or export Google Docs formats when needed.
- Sync: recursively list folders/files under the given root/folder and persist paths.

Path examples:

```text
GoogleDrive/work
GoogleDrive/work/My Drive
GoogleDrive/work/My Drive/contracts/client-a.pdf
```

Google Drive note:

- Google Drive can have duplicate file names in the same or different folders.
- Store `providerFileId` to make retrieval reliable after sync.
- The UI may display paths, but backend should prefer Drive ids internally when available.

---

## 11. API Contract Draft

All protected endpoints require:

```text
Authorization: Bearer <access-token>
```

### 11.1 Providers

```text
GET /providers
```

Response:

```ts
export interface ProviderSummaryDto {
  providerName: ProviderName;
  displayName: string;
  enabled: boolean;
  accountCount: number;
}
```

### 11.2 Accounts

```text
POST /providers/:providerName/accounts
```

Request:

```ts
export interface AddAccountRequestDto {
  accountName: string;
  credentials: Record<string, unknown>;
}
```

Response:

```ts
export interface AddAccountResponseDto {
  providerName: ProviderName;
  accountName: string;
  added: boolean;
}
```

```text
DELETE /providers/:providerName/accounts/:accountName
```

Response:

```ts
export interface RemoveAccountResponseDto {
  providerName: ProviderName;
  accountName: string;
  removed: boolean;
}
```

### 11.3 Files

```text
GET /files/list?path=<path>
```

Response:

```ts
export interface ListFilesResponseDto {
  currentPath: string;
  items: ProviderListItemDto[];
}
```

```text
GET /files/get?absolutePath=<absolutePath>
```

Response:

```ts
export interface GetFileResponseDto {
  file: ProviderFileDto;
}
```

### 11.4 Sync

```text
POST /sync
```

Request:

```ts
export interface SyncRequestDto {
  absolutePath: string;
}
```

Response:

```ts
export interface SyncResponseDto {
  syncRunId: string;
  absolutePath: string;
  status: "Completed" | "Failed";
  discovered: number;
  inserted: number;
  updated: number;
  failed: number;
  errorMessage?: string;
}
```

### 11.5 Synced records

```text
GET /sync/runs
GET /sync/runs/:syncRunId
GET /synced-files?providerName=&accountName=&bucketName=&q=&limit=&cursor=
```

Use cursor pagination for synced files.

---

## 12. API Clients Package

Create:

```text
api-clients/
├── src/
│   ├── dtos/
│   ├── interfaces/
│   ├── clients/
│   └── index.ts
├── package.json
├── tsconfig.json
├── index.md
└── rules.md
```

Requirements:

- Use native `fetch` only.
- Include interfaces and implementations.
- Sync DTOs from `app/`.
- Do not import NestJS or backend runtime code.
- Must be portable enough to copy into another app.

Recommended clients:

```text
api-clients/src/clients/auth.client.ts
api-clients/src/clients/settings.client.ts
api-clients/src/clients/providers.client.ts
api-clients/src/clients/accounts.client.ts
api-clients/src/clients/files.client.ts
api-clients/src/clients/sync.client.ts
```

Recommended common client options:

```ts
export interface SevenRouterClientOptions {
  baseUrl: string;
  accessToken?: string;
  fetchImpl?: typeof fetch;
}
```

---

## 13. UI Structure

Create the web UI under `ui/`.

Recommended structure:

```text
ui/
├── src/
│   ├── main.tsx
│   ├── app.tsx
│   ├── api/
│   ├── components/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProvidersPage.tsx
│   │   ├── ProviderAccountsPage.tsx
│   │   ├── BrowserPage.tsx
│   │   ├── SyncPage.tsx
│   │   ├── SyncedFilesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── routes/
│   └── state/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.md
└── rules.md
```

### 13.1 UI pages

`LoginPage`

- User enters app access token.
- UI calls `POST /auth/check-token`.
- If valid, store token locally and route to dashboard.

`DashboardPage`

- Show provider count.
- Show account count.
- Show recent sync runs.

`ProvidersPage`

- List Cloudflare R2 and Google Drive.
- Show enabled/disabled state and account count.

`ProviderAccountsPage`

- Add provider account.
- Remove provider account.
- Credentials fields should be provider-specific.
- Do not show stored secrets after submission.

`BrowserPage`

- Browse by path.
- Initial provider paths: `CloudflareR2`, `GoogleDrive`.
- Clicking provider path shows accounts.
- Clicking account shows buckets/roots.
- Clicking bucket/root/folder lists children.
- Clicking file can fetch file metadata/content/download URL.

`SyncPage`

- Input absolute path.
- Trigger manual sync.
- Display sync result.

`SyncedFilesPage`

- Filter synced records by provider/account/bucket/search.
- Show absolute path, type, size, modified time, last synced time.

`SettingsPage`

- View masked settings.
- Edit safe runtime settings.
- Show restart/reload note after settings changes.

---

## 14. Handoff Rules for Initial Build

Every backend API contract change must create a backend-to-UI handoff.

Create an initial handoff:

```text
handoffs/backend-to-ui/2026-06-02-initial-api-contract.md
```

Content:

```md
# Handoff: Initial API Contract

Status: Pending
Direction: Backend to UI
Created: 2026-06-02
Owner: Backend

## Summary

Initial 7router API contract for access-token auth, providers, accounts, file browsing, manual sync, synced files, and settings.

## Context

The UI needs stable backend contracts to implement provider management, file browsing, and manual sync.

## Contract / Requirement

Implement the endpoints documented in the root project setup plan and app module DTOs.

## Files Changed or Expected

- app/src/modules/auth/dtos
- app/src/modules/settings/dtos
- app/src/modules/providers/dtos
- app/src/modules/accounts/dtos
- app/src/modules/files/dtos
- app/src/modules/sync/dtos
- api-clients/src/dtos
- ui/src/pages

## Acceptance Criteria

- [ ] Requirement is implemented.
- [ ] API client is updated, if needed.
- [ ] Relevant `index.md` files are updated.
- [ ] Relevant `rules.md` files are updated, if needed.
- [ ] Smoke test passes, if applicable.

## Notes

The UI must send `Authorization: Bearer <access-token>` to protected endpoints.
```

When completed, move it to:

```text
handoffs/archive/
```

---

## 15. Documentation Requirements

Documentation is mandatory.

Create and keep updated:

```text
index.md
rules.md
agents-instructions.md
app/index.md
app/rules.md
ui/index.md
ui/rules.md
api-clients/index.md
api-clients/rules.md
api-mcp-server/index.md
api-mcp-server/rules.md
```

Each major layer must include:

```text
layer-root/
├── index.md
└── rules.md
```

### 15.1 Documentation update triggers

Update documentation whenever any of these change:

- Folder structure
- Module boundaries
- API contracts
- DTOs
- Use cases
- Infrastructure adapters
- Shared kernel concepts
- Agent implementation rules
- Handoff status

### 15.2 Entity and aggregate rule

Persist this rule in project documentation:

Entity classes must define and protect the constraints of that entity.
Use public and private properties/methods properly so invalid state cannot be created or persisted accidentally.
Aggregates must define and protect constraints involving relationships between multiple entities.

---

## 16. Agent Instructions

Create `agents-instructions.md` with these requirements.

### 16.1 General behavior

Agents must:

- Report skill names every time a skill is used.
- Keep generated code separated into appropriate files and folders.
- Keep docs updated in the same change set as code.
- Avoid large unrelated rewrites.
- Use the selected stack's naming conventions.
- Prefer dependency injection whenever possible.
- Never add Docker files or Docker-based instructions.
- Never commit local settings or secrets.

### 16.2 Architecture rules

Agents must:

- Not add a repository layer or abstract layer on top of Prisma.
- Allow use cases to depend directly on Prisma context.
- Keep controllers thin.
- Put business logic in use cases.
- Put provider-specific logic in infrastructure adapters.
- Keep shared contracts/enums/value objects in `app/src/core`.
- Ensure infrastructure implements core contracts.
- Prevent provider-specific details from leaking into controllers or use cases.

### 16.3 Implement API Skill

Use when implementing API/controller changes.

Rules:

- Must not access infrastructure directly.
- Must call use cases instead of implementing business logic inside controllers.
- Must use shared DTOs from the module DTO folder.
- Must update relevant `index.md` files when API routes or contracts change.
- Must create a backend-to-UI handoff for every API contract change.

### 16.4 Implement Infrastructure Skill

Use when implementing infrastructure adapters and external service integrations.

Rules:

- May access only core/shared-kernel contracts and infrastructure code.
- Must implement abstractions/contracts defined in the core or shared kernel.
- Must not leak provider-specific details into use cases or controllers.
- Must document any new adapter in the relevant `index.md` and `rules.md` files.

### 16.5 Smoke Test Skill

Use to verify changed functionality end-to-end.

Use `api-mcp-server/` when needed.

After a successful smoke test, the agent must:

1. Update `api-clients/` if API contracts changed.
2. Update indexing documentation for each changed layer.
3. Commit the code if operating in an environment where commits are allowed.

The smoke test result must clearly state what was tested and whether it passed.

---

## 17. Setup Commands

No Docker.

Recommended root setup:

```bash
pnpm init
pnpm add -D typescript prettier eslint vitest tsx
```

Recommended workspace file:

```yaml
packages:
  - "app"
  - "ui"
  - "api-clients"
  - "api-mcp-server"
```

Backend setup:

```bash
cd app
pnpm add @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger swagger-ui-express reflect-metadata rxjs @prisma/client zod
pnpm add -D @nestjs/cli @nestjs/testing prisma ts-node typescript vitest
pnpm prisma init --datasource-provider sqlite
```

UI setup:

```bash
cd ui
pnpm create vite . --template react-ts
pnpm add @tanstack/react-query react-router-dom react-hook-form zod
```

API clients setup:

```bash
cd api-clients
pnpm init
pnpm add -D typescript vitest tsup
```

MCP/local automation setup:

```bash
cd api-mcp-server
pnpm init
pnpm add -D typescript tsx vitest
```

---

## 18. Initial Implementation Order

Follow this order.

### Phase 1 — Project skeleton

1. Create root folders and required docs.
2. Configure pnpm workspace.
3. Configure TypeScript, ESLint, Prettier, and Vitest.
4. Add `.gitignore` with local settings and generated files.
5. Add root `index.md`, `rules.md`, and `agents-instructions.md`.

### Phase 2 — Backend foundation

1. Create NestJS app under `app/`.
2. Add settings loader from `settings.local.json`.
3. Add access-token auth guard.
4. Add Prisma schema and migration.
5. Add core enum, contracts, and path parser.
6. Add encryption service.
7. Add provider registry service that resolves `ProviderName` to adapter.

### Phase 3 — Provider adapters

1. Implement Cloudflare R2 adapter.
2. Implement Google Drive adapter.
3. Implement account validation for each adapter.
4. Implement provider path listing.
5. Implement file retrieval.
6. Implement recursive listing needed by sync.

### Phase 4 — Backend modules

1. Auth module.
2. Settings module.
3. Providers module.
4. Accounts module.
5. Files module.
6. Sync module.
7. Synced files query endpoint.
8. OpenAPI generation.

### Phase 5 — API clients

1. Copy/sync DTOs from app.
2. Create native-fetch client implementations.
3. Add tests for URL building, auth headers, and request/response handling.
4. Export all clients from `api-clients/src/index.ts`.

### Phase 6 — UI

1. Create login/access-token flow.
2. Create dashboard.
3. Create providers/accounts UI.
4. Create browser UI.
5. Create manual sync UI.
6. Create synced files UI.
7. Create settings UI.
8. Use `api-clients/` package for API calls.

### Phase 7 — Local automation and smoke tests

1. Create smoke test scripts in `api-mcp-server/`.
2. Test auth token validation.
3. Test provider listing.
4. Test account add/remove flow with mock or real test credentials.
5. Test file list flow.
6. Test manual sync flow.
7. Test UI can call the backend with access token.

---

## 19. Smoke Test Checklist

The initial implementation is not complete until these pass:

- [ ] App starts without Docker.
- [ ] UI starts without Docker.
- [ ] `settings.local.json` is ignored by git.
- [ ] Access token is required for protected API endpoints.
- [ ] UI can validate and store access token.
- [ ] `GET /providers` returns Cloudflare R2 and Google Drive.
- [ ] R2 account can be added with encrypted stored credentials.
- [ ] Google Drive account can be added with encrypted stored credentials.
- [ ] `GET /files/list?path=CloudflareR2` returns R2 accounts.
- [ ] `GET /files/list?path=GoogleDrive` returns Google Drive accounts.
- [ ] R2 bucket/object listing works.
- [ ] Google Drive folder/file listing works.
- [ ] R2 file retrieval works.
- [ ] Google Drive file retrieval works.
- [ ] `POST /sync` accepts an absolute path.
- [ ] Sync persists Provider -> Account -> Bucket -> Key records.
- [ ] Synced files can be searched/viewed from the UI.
- [ ] API clients are updated for implemented endpoints.
- [ ] Handoff docs are created for API contracts.
- [ ] `index.md` and `rules.md` files are updated.

---

## 20. Definition of Done

The project setup is done when:

1. The required root structure exists.
2. All required docs exist and explain navigation/rules.
3. The backend app runs locally without Docker.
4. The UI runs locally without Docker.
5. Access-token authentication protects backend APIs.
6. Runtime settings are stored in ignored JSON config.
7. Provider credentials are encrypted at rest.
8. Cloudflare R2 and Google Drive adapters are implemented.
9. Provider account add/remove works for both providers.
10. File listing and file retrieval work through the unified `IProvider` contract.
11. Manual sync persists Provider -> Account -> Bucket -> Key records.
12. API clients use native fetch and are portable.
13. UI uses the API clients and supports the main flows.
14. Local smoke tests are documented and pass.
15. Handoff and documentation rules are followed.

---

## 21. Important Non-Goals for Initial Version

Do not implement these unless requested later:

- Docker or Docker Compose.
- Scheduled sync.
- Background queues.
- Multi-user username/password auth.
- Billing.
- Public file sharing.
- Complex role-based access control.
- Repository layer above Prisma.
- Provider plugins loaded dynamically from npm.

---

## 22. First Prompt for Codex/Claude

Use this prompt to start implementation:

```text
You are setting up the 7router project from scratch.

Read this setup plan fully before writing code.

Create the required root structure:
app/, ui/, handoffs/archive/, handoffs/backend-to-ui/, handoffs/ui-to-backend/, api-clients/, api-mcp-server/, index.md, rules.md, agents-instructions.md.

Use TypeScript, pnpm workspaces, NestJS for app/, React + Vite for ui/, Prisma with SQLite for local no-Docker setup, native-fetch TypeScript API clients in api-clients/, and local automation/smoke testing in api-mcp-server/.

Do not use Docker.
Use access-token authentication.
Store runtime settings in ignored JSON config.
Encrypt provider account credentials before storing them.
Implement both Cloudflare R2 and Google Drive provider adapters.
Implement the unified IProvider contract.
Implement manual sync that accepts absolutePath and persists Provider -> Account -> Bucket -> Key records.

Follow the project rules, documentation requirements, handoff rules, module structure rules, and agent skill reporting rules in this plan.
Start with Phase 1 and Phase 2. Keep controllers thin, put business logic in use cases, put provider-specific logic in infrastructure adapters, and do not create a repository layer above Prisma.
```

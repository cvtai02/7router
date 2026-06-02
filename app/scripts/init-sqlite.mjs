import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import initSqlJs from "sql.js";

const dbPath = join(process.cwd(), "dev.db");
const SQL = await initSqlJs();
const db = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : new SQL.Database();

db.run(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ProviderRecord (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  displayName TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS ProviderAccount (
  id TEXT PRIMARY KEY NOT NULL,
  providerId TEXT NOT NULL,
  accountName TEXT NOT NULL,
  encryptedCredentials TEXT NOT NULL,
  credentialHint TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  CONSTRAINT ProviderAccount_providerId_fkey FOREIGN KEY (providerId) REFERENCES ProviderRecord (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ProviderAccount_providerId_accountName_key ON ProviderAccount(providerId, accountName);

CREATE TABLE IF NOT EXISTS StorageBucket (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  name TEXT NOT NULL,
  displayName TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  CONSTRAINT StorageBucket_accountId_fkey FOREIGN KEY (accountId) REFERENCES ProviderAccount (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS StorageBucket_accountId_name_key ON StorageBucket(accountId, name);

CREATE TABLE IF NOT EXISTS StorageKey (
  id TEXT PRIMARY KEY NOT NULL,
  bucketId TEXT NOT NULL,
  key TEXT NOT NULL,
  absolutePath TEXT NOT NULL UNIQUE,
  itemType TEXT NOT NULL,
  sizeBytes INTEGER,
  contentType TEXT,
  providerFileId TEXT,
  checksum TEXT,
  modifiedAt DATETIME,
  lastSyncedAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  CONSTRAINT StorageKey_bucketId_fkey FOREIGN KEY (bucketId) REFERENCES StorageBucket (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS StorageKey_bucketId_key_idx ON StorageKey(bucketId, key);

CREATE TABLE IF NOT EXISTS SyncRun (
  id TEXT PRIMARY KEY NOT NULL,
  absolutePath TEXT NOT NULL,
  providerName TEXT NOT NULL,
  accountName TEXT,
  bucketName TEXT,
  status TEXT NOT NULL,
  discovered INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  errorMessage TEXT,
  startedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME
);
`);

function cuid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

const now = new Date().toISOString();
db.run(
  "INSERT OR IGNORE INTO ProviderRecord (id, name, displayName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
  [cuid("provider"), "CloudflareR2", "Cloudflare R2", now, now],
);
db.run(
  "INSERT OR IGNORE INTO ProviderRecord (id, name, displayName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
  [cuid("provider"), "GoogleDrive", "Google Drive", now, now],
);

mkdirSync(dirname(dbPath), { recursive: true });
writeFileSync(dbPath, Buffer.from(db.export()));
console.log(`Initialized SQLite database at ${dbPath}`);

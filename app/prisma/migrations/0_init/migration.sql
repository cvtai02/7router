-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProviderName" AS ENUM ('CloudflareR2', 'GoogleDrive');

-- CreateTable
CREATE TABLE "ProviderRecord" (
    "id" TEXT NOT NULL,
    "name" "ProviderName" NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAccount" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,
    "credentialHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageBucket" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageKey" (
    "id" TEXT NOT NULL,
    "bucketId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "absolutePath" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "contentType" TEXT,
    "providerFileId" TEXT,
    "checksum" TEXT,
    "modifiedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "absolutePath" TEXT NOT NULL,
    "providerName" "ProviderName" NOT NULL,
    "accountName" TEXT,
    "bucketName" TEXT,
    "status" TEXT NOT NULL,
    "discovered" INTEGER NOT NULL DEFAULT 0,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "GoogleSetting" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "encryptedClientSecret" TEXT,
    "redirectUri" TEXT,
    "uiBaseUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderRecord_name_key" ON "ProviderRecord"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAccount_providerId_accountName_key" ON "ProviderAccount"("providerId", "accountName");

-- CreateIndex
CREATE UNIQUE INDEX "StorageBucket_accountId_name_key" ON "StorageBucket"("accountId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StorageKey_absolutePath_key" ON "StorageKey"("absolutePath");

-- CreateIndex
CREATE INDEX "StorageKey_bucketId_key_idx" ON "StorageKey"("bucketId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AccessToken_value_key" ON "AccessToken"("value");

-- AddForeignKey
ALTER TABLE "ProviderAccount" ADD CONSTRAINT "ProviderAccount_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageBucket" ADD CONSTRAINT "StorageBucket_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ProviderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageKey" ADD CONSTRAINT "StorageKey_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "StorageBucket"("id") ON DELETE CASCADE ON UPDATE CASCADE;


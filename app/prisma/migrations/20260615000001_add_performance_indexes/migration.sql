-- CreateIndex
CREATE INDEX "StorageKey_lastSyncedAt_idx" ON "StorageKey"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "SyncRun_absolutePath_idx" ON "SyncRun"("absolutePath");

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");

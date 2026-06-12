-- Access tokens move from plaintext to encrypted-at-rest storage.
-- "value" stays as a nullable legacy column; the app backfills prefix,
-- valueHash, and encryptedValue on startup and clears it.
ALTER TABLE "AccessToken" ALTER COLUMN "value" DROP NOT NULL;
ALTER TABLE "AccessToken" ADD COLUMN "prefix" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AccessToken" ADD COLUMN "valueHash" TEXT;
ALTER TABLE "AccessToken" ADD COLUMN "encryptedValue" TEXT;

CREATE UNIQUE INDEX "AccessToken_valueHash_key" ON "AccessToken"("valueHash");

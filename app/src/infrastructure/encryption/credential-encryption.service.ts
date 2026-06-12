import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

interface EncryptedSecretEnvelope {
  version: 1;
  algorithm: "aes-256-gcm";
  ivBase64: string;
  authTagBase64: string;
  ciphertextBase64: string;
}

@Injectable()
export class CredentialEncryptionService {
  encrypt(value: unknown): string {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const plaintext = Buffer.from(JSON.stringify(value), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const envelope: EncryptedSecretEnvelope = {
      version: 1,
      algorithm: "aes-256-gcm",
      ivBase64: iv.toString("base64"),
      authTagBase64: cipher.getAuthTag().toString("base64"),
      ciphertextBase64: ciphertext.toString("base64"),
    };
    return JSON.stringify(envelope);
  }

  decrypt<T>(value: string): T {
    const envelope = JSON.parse(value) as EncryptedSecretEnvelope;
    if (envelope.version !== 1 || envelope.algorithm !== "aes-256-gcm") {
      throw new Error("Unsupported encrypted credential envelope.");
    }
    const decipher = createDecipheriv("aes-256-gcm", this.getKey(), Buffer.from(envelope.ivBase64, "base64"));
    decipher.setAuthTag(Buffer.from(envelope.authTagBase64, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertextBase64, "base64")),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  }

  private getKey(): Buffer {
    const secret = process.env.ENCRYPTION_KEY ?? "";
    if (!secret) throw new Error("ENCRYPTION_KEY is not set.");
    return createHash("sha256").update(secret, "utf8").digest();
  }
}

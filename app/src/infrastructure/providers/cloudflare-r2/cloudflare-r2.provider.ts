import { Injectable } from "@nestjs/common";
import {
  CreateBucketCommand,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import {
  AddProviderAccountDto,
  DownloadFileDto,
  IProvider,
  ProviderListItemDto,
  RemoveProviderAccountDto,
  TempDownloadUrlDto,
  TempDownloadUrlRequestDto,
  TempUploadUrlDto,
  TempUploadUrlRequestDto,
  UploadFileDto,
} from "../../../core/contracts/provider.contract";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../database/prisma.service";
import { CredentialEncryptionService } from "../../encryption/credential-encryption.service";

export interface CloudflareR2CredentialsDto {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  region?: string;
}

@Injectable()
export class CloudflareR2Provider implements IProvider {
  readonly providerName = ProviderName.CloudflareR2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: CredentialEncryptionService,
  ) {}

  async listChildren(currentPath: string): Promise<ProviderListItemDto[]> {
    const parsed = ProviderAbsolutePath.parse(currentPath);
    if (!parsed.accountName) {
      const accounts = await this.prisma.providerAccount.findMany({
        where: { provider: { name: this.providerName } },
        orderBy: { accountName: "asc" },
      });
      return accounts.map((account) => ({
        name: account.accountName,
        absolutePath: `${this.providerName}/${account.accountName}`,
        type: "account",
        providerName: this.providerName,
        accountName: account.accountName,
      }));
    }

    const account = await this.findAccount(parsed.accountName);
    const credentials = this.encryption.decrypt<CloudflareR2CredentialsDto>(account.encryptedCredentials);
    const client = this.createClient(credentials);

    if (!parsed.bucketOrRootName) {
      const result = await client.send(new ListBucketsCommand({}));
      return (result.Buckets ?? []).map((bucket) => ({
        name: bucket.Name ?? "",
        absolutePath: `${this.providerName}/${parsed.accountName}/${bucket.Name}`,
        type: "bucket",
        providerName: this.providerName,
        accountName: parsed.accountName,
        bucketOrRootName: bucket.Name,
        modifiedAt: bucket.CreationDate?.toISOString(),
      }));
    }

    const prefix = parsed.keyOrPath ? `${parsed.keyOrPath.replace(/\/?$/, "/")}` : "";
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: parsed.bucketOrRootName,
        Prefix: prefix,
        Delimiter: "/",
      }),
    );

    const folders: ProviderListItemDto[] = (result.CommonPrefixes ?? [])
      .filter((item) => item.Prefix)
      .map((item) => {
        const key = item.Prefix!.replace(/\/$/, "");
        const name = key.split("/").pop() ?? key;
        return {
          name,
          absolutePath: `${this.providerName}/${parsed.accountName}/${parsed.bucketOrRootName}/${key}`,
          type: "folder",
          providerName: this.providerName,
          accountName: parsed.accountName,
          bucketOrRootName: parsed.bucketOrRootName,
          keyOrPath: key,
        };
      });

    const files: ProviderListItemDto[] = (result.Contents ?? [])
      .filter((item) => item.Key && item.Key !== prefix)
      .map((item) => ({
        name: item.Key!.split("/").pop() ?? item.Key!,
        absolutePath: `${this.providerName}/${parsed.accountName}/${parsed.bucketOrRootName}/${item.Key}`,
        type: "file",
        providerName: this.providerName,
        accountName: parsed.accountName,
        bucketOrRootName: parsed.bucketOrRootName,
        keyOrPath: item.Key,
        sizeBytes: item.Size,
        modifiedAt: item.LastModified?.toISOString(),
      }));

    return [...folders, ...files];
  }

  async addAccount(input: AddProviderAccountDto): Promise<void> {
    const credentials = input.credentials as unknown as CloudflareR2CredentialsDto;
    await this.createClient(credentials).send(new ListBucketsCommand({}));
    const provider = await this.prisma.providerRecord.upsert({
      where: { name: this.providerName },
      update: {},
      create: { name: this.providerName, displayName: "Cloudflare R2" },
    });
    await this.prisma.providerAccount.upsert({
      where: { providerId_accountName: { providerId: provider.id, accountName: input.accountName } },
      update: {
        encryptedCredentials: this.encryption.encrypt(credentials),
        credentialHint: this.mask(credentials.accountId),
      },
      create: {
        providerId: provider.id,
        accountName: input.accountName,
        encryptedCredentials: this.encryption.encrypt(credentials),
        credentialHint: this.mask(credentials.accountId),
      },
    });
  }

  async removeAccount(input: RemoveProviderAccountDto): Promise<void> {
    await this.prisma.providerAccount.deleteMany({
      where: { accountName: input.accountName, provider: { name: this.providerName } },
    });
  }

  async createFolder(parentPath: string, folderName: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(parentPath);
    if (parsed.providerName === ProviderName.CloudflareR2 && parsed.accountName && !parsed.bucketOrRootName) {
      const account = await this.findAccount(parsed.accountName);
      const client = this.createClient(this.encryption.decrypt<CloudflareR2CredentialsDto>(account.encryptedCredentials));
      await client.send(new CreateBucketCommand({ Bucket: folderName }));
      return;
    }

    if (!parsed.accountName || !parsed.bucketOrRootName) {
      throw new Error("R2 folder creation requires account and bucket in the path.");
    }
    const account = await this.findAccount(parsed.accountName);
    const client = this.createClient(this.encryption.decrypt<CloudflareR2CredentialsDto>(account.encryptedCredentials));
    const key = parsed.keyOrPath ? `${parsed.keyOrPath}/${folderName}/` : `${folderName}/`;
    await client.send(new PutObjectCommand({ Bucket: parsed.bucketOrRootName, Key: key, Body: "" }));
  }

  async uploadFile(input: UploadFileDto): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("R2 upload path must include account, bucket, and key.");
    }
    const account = await this.findAccount(parsed.accountName);
    const client = this.createClient(this.encryption.decrypt<CloudflareR2CredentialsDto>(account.encryptedCredentials));
    await client.send(new PutObjectCommand({
      Bucket: parsed.bucketOrRootName,
      Key: parsed.keyOrPath,
      Body: Buffer.from(input.contentBase64, "base64"),
      ContentType: input.contentType,
    }));
  }

  async downloadFile(absolutePath: string): Promise<DownloadFileDto> {
    const parsed = ProviderAbsolutePath.parse(absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("R2 file path must include account, bucket, and key.");
    }
    const account = await this.findAccount(parsed.accountName);
    const credentials = this.encryption.decrypt<CloudflareR2CredentialsDto>(account.encryptedCredentials);
    const client = this.createClient(credentials);
    const object = await client.send(new GetObjectCommand({ Bucket: parsed.bucketOrRootName, Key: parsed.keyOrPath }));
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) throw new Error(`R2 file has no body: ${parsed.keyOrPath}`);

    return {
      absolutePath: parsed.originalPath,
      contentType: object.ContentType,
      sizeBytes: object.ContentLength ? Number(object.ContentLength) : bytes.byteLength,
      contentBase64: Buffer.from(bytes).toString("base64"),
    };
  }

  async getTempDownloadUrl(input: TempDownloadUrlRequestDto): Promise<TempDownloadUrlDto> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("R2 temp download URL path must include account, bucket, and key.");
    }
    const expiresIn = this.normalizeExpiresInSeconds(input.expiresInSeconds);
    const account = await this.findAccount(parsed.accountName);
    const client = this.createClient(this.encryption.decrypt<CloudflareR2CredentialsDto>(account.encryptedCredentials));
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: parsed.bucketOrRootName, Key: parsed.keyOrPath }),
      { expiresIn },
    );
    return {
      absolutePath: parsed.originalPath,
      url,
      method: "GET",
      expiresAt: this.expiresAt(expiresIn),
    };
  }

  async getTempUploadUrl(input: TempUploadUrlRequestDto): Promise<TempUploadUrlDto> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("R2 temp upload URL path must include account, bucket, and key.");
    }
    const expiresIn = this.normalizeExpiresInSeconds(input.expiresInSeconds);
    const account = await this.findAccount(parsed.accountName);
    const client = this.createClient(this.encryption.decrypt<CloudflareR2CredentialsDto>(account.encryptedCredentials));
    const headers: Record<string, string> = input.contentType
      ? { "Content-Type": input.contentType }
      : {};
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: parsed.bucketOrRootName,
        Key: parsed.keyOrPath,
        ContentType: input.contentType,
      }),
      { expiresIn },
    );
    return {
      absolutePath: parsed.originalPath,
      url,
      method: "PUT",
      headers,
      expiresAt: this.expiresAt(expiresIn),
    };
  }

  private createClient(credentials: CloudflareR2CredentialsDto): S3Client {
    return new S3Client({
      region: credentials.region ?? "auto",
      endpoint: credentials.endpoint ?? `https://${credentials.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  private async findAccount(accountName: string) {
    const account = await this.prisma.providerAccount.findFirst({
      where: { accountName, provider: { name: this.providerName } },
    });
    if (!account) throw new Error(`Cloudflare R2 account not found: ${accountName}`);
    return account;
  }

  private mask(value: string): string {
    return value.length <= 4 ? "****" : `${value.slice(0, 2)}****${value.slice(-2)}`;
  }

  private normalizeExpiresInSeconds(value?: number): number {
    if (value === undefined) return 900;
    if (!Number.isFinite(value) || value <= 0) throw new Error("expiresInSeconds must be a positive number.");
    return Math.min(Math.floor(value), 604800);
  }

  private expiresAt(expiresInSeconds: number): string {
    return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }
}

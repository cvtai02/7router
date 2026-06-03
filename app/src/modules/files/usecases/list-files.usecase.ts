import { Injectable } from "@nestjs/common";
import { ProviderListItemDto } from "../../../core/contracts/provider.contract";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { ParsedProviderAbsolutePath, ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";

@Injectable()
export class ListFilesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProviderRegistryService,
  ) {}

  async execute(path: string): Promise<ListFilesResponseDto> {
    const parsed = ProviderAbsolutePath.parse(path);

    if (!parsed.accountName) return this.listAccounts(parsed.providerName, parsed.originalPath);
    if (!parsed.bucketOrRootName) return this.listBuckets(parsed, parsed.originalPath);
    return this.listKeys(parsed, parsed.originalPath);
  }

  private async listAccounts(providerName: ProviderName, currentPath: string): Promise<ListFilesResponseDto> {
    const record = await this.prisma.providerRecord.findUnique({
      where: { name: providerName },
      include: { accounts: true },
    });
    const items: ProviderListItemDto[] = (record?.accounts ?? []).map((a) => ({
      name: a.accountName,
      absolutePath: `${providerName}/${a.accountName}`,
      type: "account",
      providerName,
      accountName: a.accountName,
    }));
    return { currentPath, items };
  }

  private async listBuckets(parsed: ParsedProviderAbsolutePath, currentPath: string): Promise<ListFilesResponseDto> {
    const account = await this.prisma.providerAccount.findFirst({
      where: { accountName: parsed.accountName, provider: { name: parsed.providerName } },
      include: { buckets: true },
    });
    const provider = this.providers.resolve(parsed.providerName);
    const items: ProviderListItemDto[] = await Promise.all(
      (account?.buckets ?? []).map(async (b) => {
        const absolutePath = `${parsed.providerName}/${parsed.accountName}/${b.name}`;
        let cdnUrl: string | undefined;
        try { cdnUrl = await provider.getBucketCdnUrl(absolutePath); } catch { /* not supported */ }
        return {
          name: b.name,
          absolutePath,
          type: "bucket" as const,
          providerName: parsed.providerName,
          accountName: parsed.accountName,
          bucketOrRootName: b.name,
          cdnUrl,
        };
      }),
    );
    return { currentPath, items };
  }

  private async listKeys(parsed: ParsedProviderAbsolutePath, currentPath: string): Promise<ListFilesResponseDto> {
    const prefix = currentPath.replace(/\/$/, "") + "/";
    const all = await this.prisma.storageKey.findMany({
      where: { absolutePath: { startsWith: prefix } },
    });
    const direct = all.filter((k) => !k.absolutePath.slice(prefix.length).includes("/"));

    let bucketCdnUrl: string | null = null;
    const bucketPath = `${parsed.providerName}/${parsed.accountName}/${parsed.bucketOrRootName}`;
    try {
      bucketCdnUrl = await this.providers.resolve(parsed.providerName).getBucketCdnUrl(bucketPath);
    } catch { /* not supported */ }

    const items: ProviderListItemDto[] = direct.map((k) => {
      const name = k.absolutePath.slice(prefix.length).replace(/\/$/, "");
      const keyClean = k.key.replace(/\/$/, "");
      return {
        name,
        absolutePath: k.absolutePath,
        type: k.itemType as ProviderListItemDto["type"],
        providerName: parsed.providerName,
        accountName: parsed.accountName,
        bucketOrRootName: parsed.bucketOrRootName,
        keyOrPath: k.key || undefined,
        sizeBytes: k.sizeBytes ?? undefined,
        contentType: k.contentType ?? undefined,
        modifiedAt: k.modifiedAt?.toISOString(),
        cdnUrl: bucketCdnUrl && keyClean ? `${bucketCdnUrl}/${keyClean}` : undefined,
      };
    });

    return { currentPath, items };
  }
}

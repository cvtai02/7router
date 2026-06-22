import { Injectable } from "@nestjs/common";
import { ProviderListItemDto } from "../../../core/contracts/provider.contract";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { ParsedProviderAbsolutePath, ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";
import { mapStorageKeyToDto } from "../mappers/storage-key.mapper";

@Injectable()
export class ListFilesUseCase {
  constructor(private readonly prisma: PrismaService) {}

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
    const items: ProviderListItemDto[] = (account?.buckets ?? []).map((b) => ({
      name: b.name,
      absolutePath: `${parsed.providerName}/${parsed.accountName}/${b.name}`,
      type: "bucket",
      providerName: parsed.providerName,
      accountName: parsed.accountName,
      bucketOrRootName: b.name,
    }));
    return { currentPath, items };
  }

  private async listKeys(parsed: ParsedProviderAbsolutePath, currentPath: string): Promise<ListFilesResponseDto> {
    const prefix = currentPath.replace(/\/$/, "") + "/";
    const all = await this.prisma.storageKey.findMany({
      where: { absolutePath: { startsWith: prefix } },
    });
    const direct = all.filter((k) => !k.absolutePath.slice(prefix.length).includes("/"));

    const items = direct.map((k) =>
      mapStorageKeyToDto(k, parsed, {
        name: k.absolutePath.slice(prefix.length).replace(/\/$/, ""),
        type: k.itemType as ProviderListItemDto["type"],
      }),
    );

    return { currentPath, items };
  }
}

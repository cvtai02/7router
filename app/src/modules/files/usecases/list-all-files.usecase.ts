import { Injectable } from "@nestjs/common";
import { ProviderListItemDto } from "../../../core/contracts/provider.contract";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";

@Injectable()
export class ListAllFilesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(path: string): Promise<ListFilesResponseDto> {
    const parsed = ProviderAbsolutePath.parse(path);
    const prefix = parsed.originalPath.replace(/\/$/, "") + "/";

    const keys = await this.prisma.storageKey.findMany({
      where: { absolutePath: { startsWith: prefix }, itemType: "file" },
      orderBy: { absolutePath: "asc" },
    });

    const items: ProviderListItemDto[] = keys.map((k) => ({
      name: k.absolutePath.split("/").pop() ?? k.key,
      absolutePath: k.absolutePath,
      type: "file",
      providerName: parsed.providerName,
      accountName: parsed.accountName,
      bucketOrRootName: parsed.bucketOrRootName,
      keyOrPath: k.key || undefined,
      sizeBytes: k.sizeBytes ?? undefined,
      contentType: k.contentType ?? undefined,
      modifiedAt: k.modifiedAt?.toISOString(),
    }));

    return { currentPath: parsed.originalPath, items };
  }
}

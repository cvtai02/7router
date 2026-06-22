import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";
import { mapStorageKeyToDto } from "../mappers/storage-key.mapper";

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

    const items = keys.map((k) =>
      mapStorageKeyToDto(k, parsed, {
        name: k.absolutePath.split("/").pop() ?? k.key,
        type: "file",
      }),
    );

    return { currentPath: parsed.originalPath, items };
  }
}

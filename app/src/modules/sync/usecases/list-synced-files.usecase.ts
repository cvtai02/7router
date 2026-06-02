import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { SyncedFilesResponseDto } from "../dtos/synced-files-response.dto";

@Injectable()
export class ListSyncedFilesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: Record<string, string | undefined>): Promise<SyncedFilesResponseDto> {
    const limit = Math.min(Number(query.limit ?? 50), 100);
    const rows = await this.prisma.storageKey.findMany({
      where: {
        absolutePath: query.q ? { contains: query.q } : undefined,
        bucket: {
          name: query.bucketName,
          account: {
            accountName: query.accountName,
            provider: query.providerName ? { name: query.providerName as any } : undefined,
          },
        },
      },
      include: { bucket: { include: { account: { include: { provider: true } } } } },
      orderBy: { lastSyncedAt: "desc" },
      take: limit + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    const page = rows.slice(0, limit);
    return {
      items: page.map((row) => ({
        id: row.id,
        providerName: row.bucket.account.provider.name as any,
        accountName: row.bucket.account.accountName,
        bucketName: row.bucket.name,
        key: row.key,
        absolutePath: row.absolutePath,
        itemType: row.itemType,
        sizeBytes: row.sizeBytes ?? undefined,
        contentType: row.contentType ?? undefined,
        modifiedAt: row.modifiedAt?.toISOString(),
        lastSyncedAt: row.lastSyncedAt.toISOString(),
      })),
      nextCursor: rows.length > limit ? rows[limit].id : undefined,
    };
  }
}


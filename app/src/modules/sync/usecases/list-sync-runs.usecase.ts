import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { SyncRunDto } from "../dtos/sync-run.dto";

@Injectable()
export class ListSyncRunsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<SyncRunDto[]> {
    const runs = await this.prisma.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
    return runs.map((run) => ({
      syncRunId: run.id,
      absolutePath: run.absolutePath,
      status: run.status === "Completed" ? "Completed" : "Failed",
      providerName: run.providerName as ProviderName,
      accountName: run.accountName ?? undefined,
      bucketName: run.bucketName ?? undefined,
      discovered: run.discovered,
      inserted: run.inserted,
      updated: run.updated,
      failed: run.failed,
      errorMessage: run.errorMessage ?? undefined,
      startedAt: run.startedAt.toISOString(),
      completedAt: run.completedAt?.toISOString(),
    }));
  }
}


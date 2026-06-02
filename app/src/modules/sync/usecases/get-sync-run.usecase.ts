import { Injectable } from "@nestjs/common";
import { SyncRunDto } from "../dtos/sync-run.dto";
import { ListSyncRunsUseCase } from "./list-sync-runs.usecase";

@Injectable()
export class GetSyncRunUseCase {
  constructor(private readonly listRuns: ListSyncRunsUseCase) {}

  async execute(syncRunId: string): Promise<SyncRunDto | undefined> {
    return (await this.listRuns.execute()).find((run) => run.syncRunId === syncRunId);
  }
}


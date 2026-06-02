import { Controller, Get } from "@nestjs/common";
import { SyncRunDto } from "../dtos/sync-run.dto";
import { ListSyncRunsUseCase } from "../usecases/list-sync-runs.usecase";

@Controller()
export class ListSyncRunsApi {
  constructor(private readonly listRuns: ListSyncRunsUseCase) {}

  @Get("sync/runs")
  runs(): Promise<SyncRunDto[]> {
    return this.listRuns.execute();
  }
}


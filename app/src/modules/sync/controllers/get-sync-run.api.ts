import { Controller, Get, Param } from "@nestjs/common";
import { SyncRunDto } from "../dtos/sync-run.dto";
import { GetSyncRunUseCase } from "../usecases/get-sync-run.usecase";

@Controller()
export class GetSyncRunApi {
  constructor(private readonly getRun: GetSyncRunUseCase) {}

  @Get("sync/runs/:syncRunId")
  run(@Param("syncRunId") syncRunId: string): Promise<SyncRunDto | undefined> {
    return this.getRun.execute(syncRunId);
  }
}


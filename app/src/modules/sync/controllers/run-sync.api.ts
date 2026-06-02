import { Body, Controller, Post } from "@nestjs/common";
import { SyncRequestDto } from "../dtos/sync-request.dto";
import { SyncResponseDto } from "../dtos/sync-response.dto";
import { RunSyncUseCase } from "../usecases/run-sync.usecase";

@Controller()
export class RunSyncApi {
  constructor(private readonly runSync: RunSyncUseCase) {}

  @Post("sync")
  sync(@Body() body: SyncRequestDto): Promise<SyncResponseDto> {
    return this.runSync.execute(body);
  }
}


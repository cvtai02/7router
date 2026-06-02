import { SyncedFilesResponseDto, SyncResponseDto, SyncRunDto } from "../dtos";
import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

export class SyncClient extends BaseClient {
  constructor(options: SevenRouterClientOptions) {
    super(options);
  }

  sync(absolutePath: string): Promise<SyncResponseDto> {
    return this.request("/sync", { method: "POST", body: JSON.stringify({ absolutePath }) });
  }

  listRuns(): Promise<SyncRunDto[]> {
    return this.request("/sync/runs");
  }

  getRun(syncRunId: string): Promise<SyncRunDto> {
    return this.request(`/sync/runs/${encodeURIComponent(syncRunId)}`);
  }

  listSyncedFiles(params: Record<string, string | number | undefined> = {}): Promise<SyncedFilesResponseDto> {
    return this.request(`/synced-files${this.query(params)}`);
  }
}


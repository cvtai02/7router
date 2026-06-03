export interface SyncResponseDto {
  syncRunId: string;
  absolutePath: string;
  status: "Completed" | "Failed";
  discovered: number;
  inserted: number;
  updated: number;
  deleted: number;
  failed: number;
  errorMessage?: string;
}


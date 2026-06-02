import { SyncedFileDto } from "./synced-file.dto";

export interface SyncedFilesResponseDto {
  items: SyncedFileDto[];
  nextCursor?: string;
}


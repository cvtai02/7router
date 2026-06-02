import { ProviderListItemDto } from "./provider-list-item.dto";

export interface ListFilesResponseDto {
  currentPath: string;
  items: ProviderListItemDto[];
}


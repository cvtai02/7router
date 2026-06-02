import { ProviderListItemDto } from "../../../core/contracts/provider.contract";

export interface ListFilesResponseDto {
  currentPath: string;
  items: ProviderListItemDto[];
}


import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";

@Injectable()
export class ListFilesUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(path: string): Promise<ListFilesResponseDto> {
    const parsed = ProviderAbsolutePath.parse(path);
    const items = await this.providers.resolve(parsed.providerName).listSubFolderAndFile(parsed.originalPath);
    return { currentPath: parsed.originalPath, items };
  }
}


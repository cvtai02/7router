import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class CreateFolderUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(parentPath: string, folderName: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(parentPath);
    await this.providers.resolve(parsed.providerName).createFolder(parsed.originalPath, folderName);
  }
}

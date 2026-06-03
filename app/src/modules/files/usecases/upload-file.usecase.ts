import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class UploadFileUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(absolutePath: string, contentBase64: string, contentType?: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(absolutePath);
    await this.providers.resolve(parsed.providerName).uploadFile(parsed.originalPath, contentBase64, contentType);
  }
}

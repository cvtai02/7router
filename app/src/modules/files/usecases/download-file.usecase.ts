import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";
import { DownloadFileResponseDto } from "../dtos/download-file-response.dto";

@Injectable()
export class DownloadFileUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(absolutePath: string): Promise<DownloadFileResponseDto> {
    const parsed = ProviderAbsolutePath.parse(absolutePath);
    return { file: await this.providers.resolve(parsed.providerName).downloadFile(parsed.originalPath) };
  }
}

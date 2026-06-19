import { Injectable } from "@nestjs/common";
import { TempDownloadUrlDto, TempDownloadUrlRequestDto } from "../../../core/contracts/provider.contract";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class GetTempDownloadUrlUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(input: TempDownloadUrlRequestDto): Promise<TempDownloadUrlDto> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    return this.providers.resolve(parsed.providerName).getTempDownloadUrl({ ...input, absolutePath: parsed.originalPath });
  }
}

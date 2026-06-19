import { Injectable } from "@nestjs/common";
import { TempUploadUrlDto, TempUploadUrlRequestDto } from "../../../core/contracts/provider.contract";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class GetTempUploadUrlUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(input: TempUploadUrlRequestDto): Promise<TempUploadUrlDto> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    return this.providers.resolve(parsed.providerName).getTempUploadUrl({ ...input, absolutePath: parsed.originalPath });
  }
}

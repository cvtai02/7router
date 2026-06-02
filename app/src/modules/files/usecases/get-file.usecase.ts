import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";
import { GetFileResponseDto } from "../dtos/get-file-response.dto";

@Injectable()
export class GetFileUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(absolutePath: string): Promise<GetFileResponseDto> {
    const parsed = ProviderAbsolutePath.parse(absolutePath);
    return { file: await this.providers.resolve(parsed.providerName).getFile(parsed.originalPath) };
  }
}


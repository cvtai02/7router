import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class GetBucketCdnUrlUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(bucketPath: string): Promise<{ cdnUrl: string }> {
    const parsed = ProviderAbsolutePath.parse(bucketPath);
    const cdnUrl = await this.providers.resolve(parsed.providerName).getBucketCdnUrl(parsed.originalPath);
    return { cdnUrl };
  }
}

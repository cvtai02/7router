import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class CreateBucketUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(accountPath: string, bucketName: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(accountPath);
    await this.providers.resolve(parsed.providerName).createBucket(parsed.originalPath, bucketName);
  }
}

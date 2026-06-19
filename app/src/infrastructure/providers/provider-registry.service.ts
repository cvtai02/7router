import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../core/enums/provider-name.enum";
import { IProvider } from "../../core/contracts/provider.contract";
import { CloudflareR2Provider } from "./cloudflare-r2/cloudflare-r2.provider";
import { GoogleDriveProvider } from "./google-drive/google-drive.provider";

@Injectable()
export class ProviderRegistryService {
  constructor(
    private readonly r2: CloudflareR2Provider,
    private readonly googleDrive: GoogleDriveProvider,
  ) {}

  resolve(providerName: ProviderName): IProvider {
    if (providerName === ProviderName.CloudflareR2) return this.r2;
    if (providerName === ProviderName.GoogleDrive) return this.googleDrive;
    throw new Error(`Unsupported provider: ${providerName}`);
  }

  all(): IProvider[] {
    return [this.r2, this.googleDrive];
  }
}

import { Injectable } from "@nestjs/common";
import { SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class RevealTokenUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(tokenId: string): Promise<{ value: string }> {
    return { value: await this.settings.revealToken(tokenId) };
  }
}

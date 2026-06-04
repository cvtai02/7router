import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class ListTokensUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(): Promise<{ tokens: MaskedToken[] }> {
    return { tokens: await this.settings.listTokens() };
  }
}

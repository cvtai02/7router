import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class ListTokensUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(): { tokens: MaskedToken[] } {
    return { tokens: this.settings.listTokens() };
  }
}

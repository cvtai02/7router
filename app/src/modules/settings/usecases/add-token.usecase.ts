import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class AddTokenUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(name: string, value: string): { tokens: MaskedToken[] } {
    return { tokens: this.settings.addToken(name, value) };
  }
}

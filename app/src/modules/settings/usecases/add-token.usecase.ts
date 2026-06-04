import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class AddTokenUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(name: string, value: string): Promise<{ tokens: MaskedToken[] }> {
    return { tokens: await this.settings.addToken(name, value) };
  }
}

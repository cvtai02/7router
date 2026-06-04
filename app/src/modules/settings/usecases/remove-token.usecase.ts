import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class RemoveTokenUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(id: string): Promise<{ tokens: MaskedToken[] }> {
    return { tokens: await this.settings.removeToken(id) };
  }
}

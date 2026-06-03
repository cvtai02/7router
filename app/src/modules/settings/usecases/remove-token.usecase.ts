import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class RemoveTokenUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(id: string): { tokens: MaskedToken[] } {
    return { tokens: this.settings.removeToken(id) };
  }
}

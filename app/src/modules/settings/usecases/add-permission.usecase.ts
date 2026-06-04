import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService, TokenPermission } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class AddPermissionUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(tokenId: string, path: string, access: TokenPermission["access"]): Promise<{ tokens: MaskedToken[] }> {
    return { tokens: await this.settings.addPermission(tokenId, path, access) };
  }
}

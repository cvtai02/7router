import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService, TokenPermission } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class AddPermissionUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(tokenId: string, path: string, access: TokenPermission["access"]): { tokens: MaskedToken[] } {
    return { tokens: this.settings.addPermission(tokenId, path, access) };
  }
}

import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class RemovePermissionUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(tokenId: string, permissionIndex: number): { tokens: MaskedToken[] } {
    return { tokens: this.settings.removePermission(tokenId, permissionIndex) };
  }
}

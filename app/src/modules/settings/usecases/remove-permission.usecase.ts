import { Injectable } from "@nestjs/common";
import { MaskedToken, SettingsService } from "../../../infrastructure/settings/settings.service";

@Injectable()
export class RemovePermissionUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(tokenId: string, permissionIndex: number): Promise<{ tokens: MaskedToken[] }> {
    return { tokens: await this.settings.removePermission(tokenId, permissionIndex) };
  }
}

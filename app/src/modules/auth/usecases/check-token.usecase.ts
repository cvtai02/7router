import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { SettingsService } from "../../../infrastructure/settings/settings.service";
import { CheckTokenRequestDto } from "../dtos/check-token-request.dto";
import { CheckTokenResponseDto } from "../dtos/check-token-response.dto";

@Injectable()
export class CheckTokenUseCase {
  constructor(
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CheckTokenRequestDto): Promise<CheckTokenResponseDto> {
    const systemToken = this.settings.getSystemSecret();
    if (systemToken && input.accessToken === systemToken) return { valid: true };
    const token = await this.prisma.accessToken.findUnique({ where: { value: input.accessToken } });
    return { valid: token !== null };
  }
}

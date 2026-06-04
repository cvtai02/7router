import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { TokenPermission } from "../../../infrastructure/settings/settings.service";

export interface AccessibleDirectory {
  path: string;
  access: TokenPermission["access"];
}

export interface GetAccessibleDirectoriesResponseDto {
  isAdmin: boolean;
  directories: AccessibleDirectory[];
}

@Injectable()
export class GetAccessibleDirectoriesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(bearerToken: string): Promise<GetAccessibleDirectoriesResponseDto> {
    const systemSecret = process.env.SYSTEM_SECRET ?? "";
    if (systemSecret && bearerToken === systemSecret) {
      return { isAdmin: true, directories: [] };
    }

    const token = await this.prisma.accessToken.findUnique({ where: { value: bearerToken } });
    if (!token) return { isAdmin: false, directories: [] };

    const directories = JSON.parse(token.permissions) as AccessibleDirectory[];
    return { isAdmin: false, directories };
  }
}

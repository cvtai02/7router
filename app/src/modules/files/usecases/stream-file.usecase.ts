import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { hashAccessTokenValue, safeEqualSecret } from "../../../core/security/access-token-hash";
import { isPathAllowed, PathPermission } from "../../../core/security/path-permission";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

export interface StreamFileResult {
  contentBase64: string;
  contentType?: string;
}

@Injectable()
export class StreamFileUseCase {
  constructor(
    private readonly providers: ProviderRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(absolutePath: string, token: string): Promise<StreamFileResult> {
    const systemToken = process.env.SYSTEM_SECRET ?? "";
    const isAdmin = systemToken && safeEqualSecret(token, systemToken);

    if (!isAdmin) {
      const clientToken = await this.prisma.accessToken.findUnique({ where: { valueHash: hashAccessTokenValue(token) } });
      if (!clientToken) throw new UnauthorizedException("Valid access token required.");
      const permissions = JSON.parse(clientToken.permissions) as PathPermission[];
      if (!isPathAllowed(permissions, absolutePath, "read")) {
        throw new ForbiddenException("Token does not have permission for this path.");
      }
    }

    const parsed = ProviderAbsolutePath.parse(absolutePath);
    const file = await this.providers.resolve(parsed.providerName).downloadFile(parsed.originalPath);
    return { contentBase64: file.contentBase64, contentType: file.contentType };
  }
}

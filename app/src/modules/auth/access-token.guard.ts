import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { TokenPermission } from "../../infrastructure/settings/settings.service";
import { ACCESS_OVERRIDE_KEY, POLICY_KEY } from "./policy.decorator";

export const IS_PUBLIC_ROUTE = "isPublicRoute";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      method: string;
      query: Record<string, string | undefined>;
      body: Record<string, string | undefined>;
    }>();

    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) throw new UnauthorizedException("Valid access token required.");

    const systemToken = process.env.SYSTEM_SECRET ?? "";
    if (systemToken && token === systemToken) return true;

    const clientToken = await this.prisma.accessToken.findUnique({ where: { value: token } });
    if (!clientToken) throw new UnauthorizedException("Valid access token required.");

    const policy = this.reflector.getAllAndOverride<string | undefined>(POLICY_KEY, [context.getHandler(), context.getClass()]);
    if (policy !== "client-api") throw new ForbiddenException("This endpoint requires admin access.");

    const path =
      request.query.path ??
      request.query.absolutePath ??
      request.body?.path ??
      request.body?.absolutePath ??
      request.body?.parentPath ??
      request.body?.accountPath;
    if (!path) throw new ForbiddenException("Path required for client token access.");

    const accessOverride = this.reflector.getAllAndOverride<string | undefined>(ACCESS_OVERRIDE_KEY, [context.getHandler(), context.getClass()]);
    const isWrite = accessOverride ? accessOverride === "write" : ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());
    const needed = isWrite ? "write" : "read";

    const permissions = JSON.parse(clientToken.permissions) as TokenPermission[];
    const allowed = permissions.some((p) => {
      const pathMatch = path === p.path || path.startsWith(p.path + "/");
      const accessMatch = p.access === "read-write" || p.access === needed;
      return pathMatch && accessMatch;
    });

    if (!allowed) throw new ForbiddenException("Token does not have permission for this path.");
    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SettingsService } from "../../infrastructure/settings/settings.service";

export const IS_PUBLIC_ROUTE = "isPublicRoute";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly settings: SettingsService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token || !this.settings.get().auth.accessTokens.includes(token)) {
      throw new UnauthorizedException("Valid access token required.");
    }
    return true;
  }
}


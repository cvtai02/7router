import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";

export interface TokenPermission {
  path: string;
  access: "read" | "write" | "read-write";
}

export interface MaskedToken {
  id: string;
  name: string;
  value: string; // "<8-char-prefix>.••••••••"
  permissions: TokenPermission[];
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getSystemSecret(): string {
    return process.env.SYSTEM_SECRET ?? "";
  }

  async listTokens(): Promise<MaskedToken[]> {
    const tokens = await this.prisma.accessToken.findMany({ orderBy: { createdAt: "asc" } });
    return tokens.map((t) => this.toMasked(t));
  }

  async addToken(name: string, value: string): Promise<MaskedToken[]> {
    await this.prisma.accessToken.create({ data: { name, value, permissions: "[]" } });
    return this.listTokens();
  }

  async removeToken(tokenId: string): Promise<MaskedToken[]> {
    await this.prisma.accessToken.delete({ where: { id: tokenId } });
    return this.listTokens();
  }

  async addPermission(tokenId: string, path: string, access: TokenPermission["access"]): Promise<MaskedToken[]> {
    const token = await this.prisma.accessToken.findUniqueOrThrow({ where: { id: tokenId } });
    const perms = JSON.parse(token.permissions) as TokenPermission[];
    perms.push({ path, access });
    await this.prisma.accessToken.update({ where: { id: tokenId }, data: { permissions: JSON.stringify(perms) } });
    return this.listTokens();
  }

  async removePermission(tokenId: string, permissionIndex: number): Promise<MaskedToken[]> {
    const token = await this.prisma.accessToken.findUniqueOrThrow({ where: { id: tokenId } });
    const perms = JSON.parse(token.permissions) as TokenPermission[];
    perms.splice(permissionIndex, 1);
    await this.prisma.accessToken.update({ where: { id: tokenId }, data: { permissions: JSON.stringify(perms) } });
    return this.listTokens();
  }

  static generateTokenValue(): string {
    const id = randomBytes(4).toString("hex");
    const secret = randomBytes(28).toString("hex");
    return `${id}.${secret}`;
  }

  private toMasked(t: { id: string; name: string; value: string; permissions: string }): MaskedToken {
    const dot = t.value.indexOf(".");
    const masked = dot >= 0 ? `${t.value.slice(0, dot)}.••••••••` : "••••••••";
    return {
      id: t.id,
      name: t.name,
      value: masked,
      permissions: JSON.parse(t.permissions) as TokenPermission[],
    };
  }
}

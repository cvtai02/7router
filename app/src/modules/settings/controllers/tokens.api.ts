import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { MaskedToken, TokenPermission } from "../../../infrastructure/settings/settings.service";
import { AddTokenUseCase } from "../usecases/add-token.usecase";
import { ListTokensUseCase } from "../usecases/list-tokens.usecase";
import { RemoveTokenUseCase } from "../usecases/remove-token.usecase";
import { AddPermissionUseCase } from "../usecases/add-permission.usecase";
import { RemovePermissionUseCase } from "../usecases/remove-permission.usecase";

@Controller("settings/tokens")
export class TokensApi {
  constructor(
    @Inject(ListTokensUseCase) private readonly list: ListTokensUseCase,
    @Inject(AddTokenUseCase) private readonly add: AddTokenUseCase,
    @Inject(RemoveTokenUseCase) private readonly remove: RemoveTokenUseCase,
    @Inject(AddPermissionUseCase) private readonly addPerm: AddPermissionUseCase,
    @Inject(RemovePermissionUseCase) private readonly removePerm: RemovePermissionUseCase,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get()
  listTokens(): Promise<{ tokens: MaskedToken[] }> {
    return this.list.execute();
  }

  @Post()
  addToken(@Body() body: { name: string; token: string }): Promise<{ tokens: MaskedToken[] }> {
    return this.add.execute(body.name, body.token);
  }

  @Get(":id/reveal")
  async revealToken(@Param("id") id: string): Promise<{ value: string }> {
    const token = await this.prisma.accessToken.findUniqueOrThrow({ where: { id } });
    return { value: token.value };
  }

  @Delete(":id")
  removeToken(@Param("id") id: string): Promise<{ tokens: MaskedToken[] }> {
    return this.remove.execute(id);
  }

  @Post(":id/permissions")
  addPermission(
    @Param("id") id: string,
    @Body() body: { path: string; access: TokenPermission["access"] },
  ): Promise<{ tokens: MaskedToken[] }> {
    return this.addPerm.execute(id, body.path, body.access);
  }

  @Delete(":id/permissions/:index")
  removePermission(
    @Param("id") id: string,
    @Param("index", ParseIntPipe) index: number,
  ): Promise<{ tokens: MaskedToken[] }> {
    return this.removePerm.execute(id, index);
  }
}

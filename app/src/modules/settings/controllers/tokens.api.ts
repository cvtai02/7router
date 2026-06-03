import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { MaskedToken, TokenPermission } from "../../../infrastructure/settings/settings.service";
import { AddTokenUseCase } from "../usecases/add-token.usecase";
import { ListTokensUseCase } from "../usecases/list-tokens.usecase";
import { RemoveTokenUseCase } from "../usecases/remove-token.usecase";
import { AddPermissionUseCase } from "../usecases/add-permission.usecase";
import { RemovePermissionUseCase } from "../usecases/remove-permission.usecase";

@Controller("settings/tokens")
export class TokensApi {
  constructor(
    private readonly list: ListTokensUseCase,
    private readonly add: AddTokenUseCase,
    private readonly remove: RemoveTokenUseCase,
    private readonly addPerm: AddPermissionUseCase,
    private readonly removePerm: RemovePermissionUseCase,
  ) {}

  @Get()
  listTokens(): { tokens: MaskedToken[] } {
    return this.list.execute();
  }

  @Post()
  addToken(@Body() body: { name: string; token: string }): { tokens: MaskedToken[] } {
    return this.add.execute(body.name, body.token);
  }

  @Delete(":id")
  removeToken(@Param("id") id: string): { tokens: MaskedToken[] } {
    return this.remove.execute(id);
  }

  @Post(":id/permissions")
  addPermission(
    @Param("id") id: string,
    @Body() body: { path: string; access: TokenPermission["access"] },
  ): { tokens: MaskedToken[] } {
    return this.addPerm.execute(id, body.path, body.access);
  }

  @Delete(":id/permissions/:index")
  removePermission(
    @Param("id") id: string,
    @Param("index", ParseIntPipe) index: number,
  ): { tokens: MaskedToken[] } {
    return this.removePerm.execute(id, index);
  }
}

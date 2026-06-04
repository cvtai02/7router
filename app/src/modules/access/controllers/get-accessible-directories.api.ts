import { Controller, Get, Inject, Req } from "@nestjs/common";
import { PublicRoute } from "../../auth/public-route.decorator";
import { GetAccessibleDirectoriesResponseDto, GetAccessibleDirectoriesUseCase } from "../usecases/get-accessible-directories.usecase";

@Controller("access")
export class GetAccessibleDirectoriesApi {
  constructor(
    @Inject(GetAccessibleDirectoriesUseCase)
    private readonly useCase: GetAccessibleDirectoriesUseCase,
  ) {}

  @PublicRoute()
  @Get("directories")
  get(@Req() req: { headers: Record<string, string | undefined> }): Promise<GetAccessibleDirectoriesResponseDto> {
    const header = req.headers["authorization"] ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    return this.useCase.execute(token);
  }
}

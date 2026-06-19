import { Controller, Get } from "@nestjs/common";
import { PublicRoute } from "../../auth/public-route.decorator";
import { HealthResponseDto } from "../dtos/health-response.dto";
import { GetHealthUseCase } from "../usecases/get-health.usecase";

@Controller("health")
export class GetHealthApi {
  constructor(private readonly getHealth: GetHealthUseCase) {}

  @PublicRoute()
  @Get()
  get(): HealthResponseDto {
    return this.getHealth.execute();
  }
}

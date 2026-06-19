import { Injectable } from "@nestjs/common";
import { HealthResponseDto } from "../dtos/health-response.dto";

@Injectable()
export class GetHealthUseCase {
  execute(): HealthResponseDto {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}

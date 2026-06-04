import { Injectable } from "@nestjs/common";

@Injectable()
export class GetSettingsUseCase {
  execute(): Record<string, never> {
    return {};
  }
}

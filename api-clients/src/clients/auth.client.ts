import { CheckTokenResponseDto } from "../dtos";
import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

export class AuthClient extends BaseClient {
  constructor(options: SevenRouterClientOptions) {
    super(options);
  }

  checkToken(accessToken: string): Promise<CheckTokenResponseDto> {
    return this.request("/auth/check-token", { method: "POST", body: JSON.stringify({ accessToken }) });
  }
}


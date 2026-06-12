import { BadRequestException, Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { PublicRoute } from "../../auth/public-route.decorator";
import { StartGoogleDriveOAuthRequestDto } from "../dtos/start-google-drive-oauth-request.dto";
import { StartGoogleDriveOAuthResponseDto } from "../dtos/start-google-drive-oauth-response.dto";
import { GoogleDriveOAuthUseCase } from "../usecases/google-drive-oauth.usecase";

@Controller("providers/:providerName/accounts/oauth")
export class GoogleDriveOAuthApi {
  constructor(private readonly googleDriveOAuth: GoogleDriveOAuthUseCase) {}

  @Post("start")
  async start(
    @Param("providerName") providerName: ProviderName,
    @Body() body: StartGoogleDriveOAuthRequestDto,
  ): Promise<StartGoogleDriveOAuthResponseDto> {
    if (providerName !== ProviderName.GoogleDrive) {
      throw new BadRequestException("OAuth is only supported for Google Drive.");
    }
    return { authUrl: await this.googleDriveOAuth.start(body.accountName, body.returnUrl) };
  }

  @PublicRoute()
  @Get("callback")
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Res() response: { redirect: (url: string) => void },
  ): Promise<void> {
    if (error) {
      response.redirect(await this.googleDriveOAuth.errorRedirect(error, state));
      return;
    }
    if (!code || !state) {
      response.redirect(await this.googleDriveOAuth.errorRedirect("Missing OAuth callback parameters.", state));
      return;
    }
    try {
      response.redirect(await this.googleDriveOAuth.complete(code, state));
    } catch (err) {
      response.redirect(await this.googleDriveOAuth.errorRedirect(err instanceof Error ? err.message : "Google OAuth failed.", state));
    }
  }
}

import { Module } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { SettingsService } from "./infrastructure/settings/settings.service";
import { PrismaService } from "./infrastructure/database/prisma.service";
import { CredentialEncryptionService } from "./infrastructure/encryption/credential-encryption.service";
import { CloudflareR2Provider } from "./infrastructure/providers/cloudflare-r2/cloudflare-r2.provider";
import { GoogleDriveProvider } from "./infrastructure/providers/google-drive/google-drive.provider";
import { ProviderRegistryService } from "./infrastructure/providers/provider-registry.service";
import { AccessTokenGuard } from "./modules/auth/access-token.guard";
import { CheckTokenApi } from "./modules/auth/controllers/check-token.api";
import { CheckTokenUseCase } from "./modules/auth/usecases/check-token.usecase";
import { GetSettingsApi } from "./modules/settings/controllers/get-settings.api";
import { ReloadSettingsApi } from "./modules/settings/controllers/reload-settings.api";
import { TokensApi } from "./modules/settings/controllers/tokens.api";
import { UpdateSettingsApi } from "./modules/settings/controllers/update-settings.api";
import { AddTokenUseCase } from "./modules/settings/usecases/add-token.usecase";
import { GetSettingsUseCase } from "./modules/settings/usecases/get-settings.usecase";
import { ListTokensUseCase } from "./modules/settings/usecases/list-tokens.usecase";
import { ReloadSettingsUseCase } from "./modules/settings/usecases/reload-settings.usecase";
import { RemoveTokenUseCase } from "./modules/settings/usecases/remove-token.usecase";
import { RevealTokenUseCase } from "./modules/settings/usecases/reveal-token.usecase";
import { AddPermissionUseCase } from "./modules/settings/usecases/add-permission.usecase";
import { RemovePermissionUseCase } from "./modules/settings/usecases/remove-permission.usecase";
import { UpdateSettingsUseCase } from "./modules/settings/usecases/update-settings.usecase";
import { GetProviderApi } from "./modules/providers/controllers/get-provider.api";
import { ListProviderAccountsApi } from "./modules/providers/controllers/list-provider-accounts.api";
import { ListProvidersApi } from "./modules/providers/controllers/list-providers.api";
import { GetProviderUseCase } from "./modules/providers/usecases/get-provider.usecase";
import { ListProviderAccountsUseCase } from "./modules/providers/usecases/list-provider-accounts.usecase";
import { ListProvidersUseCase } from "./modules/providers/usecases/list-providers.usecase";
import { AddAccountApi } from "./modules/accounts/controllers/add-account.api";
import { GoogleDriveOAuthApi } from "./modules/accounts/controllers/google-drive-oauth.api";
import { RemoveAccountApi } from "./modules/accounts/controllers/remove-account.api";
import { AddAccountUseCase } from "./modules/accounts/usecases/add-account.usecase";
import { GoogleDriveOAuthUseCase } from "./modules/accounts/usecases/google-drive-oauth.usecase";
import { RemoveAccountUseCase } from "./modules/accounts/usecases/remove-account.usecase";
import { CreateBucketApi } from "./modules/files/controllers/create-bucket.api";
import { CreateFolderApi } from "./modules/files/controllers/create-folder.api";
import { UploadFileApi } from "./modules/files/controllers/upload-file.api";
import { DownloadFileApi } from "./modules/files/controllers/download-file.api";
import { GetTempDownloadUrlApi } from "./modules/files/controllers/get-temp-download-url.api";
import { GetTempUploadUrlApi } from "./modules/files/controllers/get-temp-upload-url.api";
import { ListFilesApi } from "./modules/files/controllers/list-files.api";
import { ListAllFilesApi } from "./modules/files/controllers/list-all-files.api";
import { ListAllFilesUseCase } from "./modules/files/usecases/list-all-files.usecase";
import { CreateBucketUseCase } from "./modules/files/usecases/create-bucket.usecase";
import { CreateFolderUseCase } from "./modules/files/usecases/create-folder.usecase";
import { UploadFileUseCase } from "./modules/files/usecases/upload-file.usecase";
import { DownloadFileUseCase } from "./modules/files/usecases/download-file.usecase";
import { GetTempDownloadUrlUseCase } from "./modules/files/usecases/get-temp-download-url.usecase";
import { GetTempUploadUrlUseCase } from "./modules/files/usecases/get-temp-upload-url.usecase";
import { ListFilesUseCase } from "./modules/files/usecases/list-files.usecase";
import { GetAccessibleDirectoriesApi } from "./modules/access/controllers/get-accessible-directories.api";
import { GetAccessibleDirectoriesUseCase } from "./modules/access/usecases/get-accessible-directories.usecase";
import { GetSyncRunApi } from "./modules/sync/controllers/get-sync-run.api";
import { ListSyncedFilesApi } from "./modules/sync/controllers/list-synced-files.api";
import { ListSyncRunsApi } from "./modules/sync/controllers/list-sync-runs.api";
import { RunSyncApi } from "./modules/sync/controllers/run-sync.api";
import { GetSyncRunUseCase } from "./modules/sync/usecases/get-sync-run.usecase";
import { ListSyncedFilesUseCase } from "./modules/sync/usecases/list-synced-files.usecase";
import { ListSyncRunsUseCase } from "./modules/sync/usecases/list-sync-runs.usecase";
import { RunSyncUseCase } from "./modules/sync/usecases/run-sync.usecase";

@Module({
  controllers: [
    GetAccessibleDirectoriesApi,
    CheckTokenApi,
    GetSettingsApi,
    UpdateSettingsApi,
    ReloadSettingsApi,
    TokensApi,
    ListProvidersApi,
    GetProviderApi,
    ListProviderAccountsApi,
    AddAccountApi,
    GoogleDriveOAuthApi,
    RemoveAccountApi,
    ListFilesApi,
    ListAllFilesApi,
    DownloadFileApi,
    GetTempDownloadUrlApi,
    GetTempUploadUrlApi,
    CreateFolderApi,
    CreateBucketApi,
    UploadFileApi,
    RunSyncApi,
    ListSyncRunsApi,
    GetSyncRunApi,
    ListSyncedFilesApi,
  ],
  providers: [
    SettingsService,
    PrismaService,
    CredentialEncryptionService,
    CloudflareR2Provider,
    GoogleDriveProvider,
    ProviderRegistryService,
    GetAccessibleDirectoriesUseCase,
    CheckTokenUseCase,
    GetSettingsUseCase,
    UpdateSettingsUseCase,
    ReloadSettingsUseCase,
    ListTokensUseCase,
    AddTokenUseCase,
    RemoveTokenUseCase,
    RevealTokenUseCase,
    AddPermissionUseCase,
    RemovePermissionUseCase,
    ListProvidersUseCase,
    GetProviderUseCase,
    ListProviderAccountsUseCase,
    AddAccountUseCase,
    GoogleDriveOAuthUseCase,
    RemoveAccountUseCase,
    ListFilesUseCase,
    ListAllFilesUseCase,
    DownloadFileUseCase,
    GetTempDownloadUrlUseCase,
    GetTempUploadUrlUseCase,
    CreateFolderUseCase,
    CreateBucketUseCase,
    UploadFileUseCase,
    RunSyncUseCase,
    ListSyncRunsUseCase,
    GetSyncRunUseCase,
    ListSyncedFilesUseCase,
    Reflector,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
})
export class AppModule {}

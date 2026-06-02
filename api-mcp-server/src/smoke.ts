import { AuthClient, FilesClient, ProvidersClient, SyncClient } from "@7router/api-clients";

const baseUrl = process.env.SEVEN_ROUTER_API_BASE_URL ?? "http://localhost:3000";
const accessToken = process.env.SEVEN_ROUTER_ACCESS_TOKEN ?? "dev-local-token";

async function main() {
  const auth = new AuthClient({ baseUrl });
  const check = await auth.checkToken(accessToken);
  if (!check.valid) throw new Error("Access token validation failed.");

  const providers = await new ProvidersClient({ baseUrl, accessToken }).listProviders();
  if (!providers.some((provider) => provider.providerName === "CloudflareR2")) throw new Error("Cloudflare R2 missing.");
  if (!providers.some((provider) => provider.providerName === "GoogleDrive")) throw new Error("Google Drive missing.");

  const files = new FilesClient({ baseUrl, accessToken });
  await files.list("CloudflareR2");
  await files.list("GoogleDrive");

  const runs = await new SyncClient({ baseUrl, accessToken }).listRuns();
  console.log(JSON.stringify({ auth: check.valid, providers: providers.length, syncRuns: runs.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


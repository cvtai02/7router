import { SetMetadata } from "@nestjs/common";

export const POLICY_KEY = "policy";
export const Policy = (policy: "client-api") => SetMetadata(POLICY_KEY, policy);

export const ACCESS_OVERRIDE_KEY = "accessOverride";
export const ReadAccess = () => SetMetadata(ACCESS_OVERRIDE_KEY, "read");

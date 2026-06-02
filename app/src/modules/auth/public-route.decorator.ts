import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_ROUTE } from "./access-token.guard";

export const PublicRoute = () => SetMetadata(IS_PUBLIC_ROUTE, true);


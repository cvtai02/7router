import { ProviderName } from "../enums/provider-name.enum";

export interface ParsedProviderAbsolutePath {
  providerName: ProviderName;
  accountName?: string;
  bucketOrRootName?: string;
  keyOrPath?: string;
  originalPath: string;
}

export class ProviderAbsolutePath {
  static parse(path: string): ParsedProviderAbsolutePath {
    const originalPath = path.trim().replace(/^\/+|\/+$/g, "");
    if (!originalPath) {
      throw new Error("Path is required.");
    }

    const [providerSegment, accountName, bucketOrRootName, ...keySegments] = originalPath.split("/");
    if (!Object.values(ProviderName).includes(providerSegment as ProviderName)) {
      throw new Error(`Unsupported provider: ${providerSegment}`);
    }

    if (accountName !== undefined && accountName.trim().length === 0) {
      throw new Error("Account segment cannot be empty.");
    }

    if (bucketOrRootName !== undefined && bucketOrRootName.trim().length === 0) {
      throw new Error("Bucket/root segment cannot be empty.");
    }

    const keyOrPath = keySegments.length > 0 ? keySegments.join("/") : undefined;
    return {
      providerName: providerSegment as ProviderName,
      accountName,
      bucketOrRootName,
      keyOrPath,
      originalPath,
    };
  }
}


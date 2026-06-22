import { ProviderListItemDto } from "../../../core/contracts/provider.contract";
import { ParsedProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";

export interface StorageKeyRecord {
  absolutePath: string;
  key: string;
  itemType: string;
  sizeBytes: number | null;
  contentType: string | null;
  modifiedAt: Date | null;
}

export function mapStorageKeyToDto(
  k: StorageKeyRecord,
  parsed: ParsedProviderAbsolutePath,
  opts: { name: string; type: ProviderListItemDto["type"] },
): ProviderListItemDto {
  return {
    name: opts.name,
    absolutePath: k.absolutePath,
    type: opts.type,
    providerName: parsed.providerName,
    accountName: parsed.accountName,
    bucketOrRootName: parsed.bucketOrRootName,
    keyOrPath: k.key || undefined,
    sizeBytes: k.sizeBytes ?? undefined,
    contentType: k.contentType ?? undefined,
    modifiedAt: k.modifiedAt?.toISOString(),
  };
}

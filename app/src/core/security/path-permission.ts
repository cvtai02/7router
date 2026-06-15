export type AccessLevel = "read" | "write" | "read-write";

export interface PathPermission {
  path: string;
  access: AccessLevel;
}

/**
 * Normalize a provider path the same way ProviderAbsolutePath.parse does
 * (trim + strip leading/trailing slashes) so the guard authorizes exactly the
 * path the use cases act on.
 */
export function normalizeProviderPath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, "");
}

/**
 * True if any granted permission covers `requestedPath` at the needed access
 * level. A permission for `P` covers `P` itself and anything under `P/` — the
 * trailing-slash check prevents a permission for `.../bucket` from leaking into
 * a sibling like `.../bucketOther`.
 */
export function isPathAllowed(
  permissions: PathPermission[],
  requestedPath: string,
  needed: "read" | "write",
): boolean {
  const path = normalizeProviderPath(requestedPath);
  if (!path) return false;
  return permissions.some((p) => {
    const base = normalizeProviderPath(p.path);
    const pathMatch = path === base || path.startsWith(base + "/");
    const accessMatch = p.access === "read-write" || p.access === needed;
    return pathMatch && accessMatch;
  });
}

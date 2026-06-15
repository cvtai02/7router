import { describe, expect, it } from "vitest";
import { isPathAllowed, normalizeProviderPath, PathPermission } from "./path-permission";

const rw: PathPermission = { path: "CloudflareR2/acc/bucket", access: "read-write" };
const ro: PathPermission = { path: "CloudflareR2/acc/bucket", access: "read" };

describe("normalizeProviderPath", () => {
  it("trims and strips leading/trailing slashes", () => {
    expect(normalizeProviderPath("  /CloudflareR2/acc/bucket/ ")).toBe("CloudflareR2/acc/bucket");
  });
});

describe("isPathAllowed", () => {
  it("allows the exact granted path", () => {
    expect(isPathAllowed([ro], "CloudflareR2/acc/bucket", "read")).toBe(true);
  });

  it("allows paths nested under the granted path", () => {
    expect(isPathAllowed([ro], "CloudflareR2/acc/bucket/images/a.jpg", "read")).toBe(true);
  });

  it("does NOT leak into a sibling sharing the prefix", () => {
    // classic prefix bug: "bucket" must not authorize "bucketOther"
    expect(isPathAllowed([ro], "CloudflareR2/acc/bucketOther", "read")).toBe(false);
  });

  it("matches regardless of leading/trailing slashes on either side", () => {
    expect(isPathAllowed([{ path: "/CloudflareR2/acc/bucket/", access: "read" }], "CloudflareR2/acc/bucket/x", "read")).toBe(true);
    expect(isPathAllowed([ro], "/CloudflareR2/acc/bucket/x/", "read")).toBe(true);
  });

  it("enforces access level: read-only token cannot write", () => {
    expect(isPathAllowed([ro], "CloudflareR2/acc/bucket/x", "write")).toBe(false);
  });

  it("read-write satisfies both read and write", () => {
    expect(isPathAllowed([rw], "CloudflareR2/acc/bucket/x", "read")).toBe(true);
    expect(isPathAllowed([rw], "CloudflareR2/acc/bucket/x", "write")).toBe(true);
  });

  it("denies when no permissions are granted", () => {
    expect(isPathAllowed([], "CloudflareR2/acc/bucket", "read")).toBe(false);
  });

  it("denies an empty path", () => {
    expect(isPathAllowed([rw], "   ", "read")).toBe(false);
  });
});

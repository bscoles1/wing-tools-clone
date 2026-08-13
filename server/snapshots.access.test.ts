import { describe, expect, it } from "vitest";
import { getUploadLimit, hasFeatureAccess, hasReachedUploadLimit } from "./snapshots";

describe("payment-free workspace access", () => {
  it("allows every documented tool regardless of historical subscription data", async () => {
    const features = ["routing_table", "signal_flow", "routing_diff", "snapshot_linter", "source_management"] as const;
    await expect(Promise.all(features.map((feature) => hasFeatureAccess(999, feature)))).resolves.toEqual([true, true, true, true, true]);
  });

  it("does not enforce tier upload limits", async () => {
    expect(getUploadLimit("Free")).toBe(Number.MAX_SAFE_INTEGER);
    expect(getUploadLimit("Basic")).toBe(Number.MAX_SAFE_INTEGER);
    expect(getUploadLimit("Premium")).toBe(Number.MAX_SAFE_INTEGER);
    await expect(hasReachedUploadLimit(999)).resolves.toBe(false);
  });
});

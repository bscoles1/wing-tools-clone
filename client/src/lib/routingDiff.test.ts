import { describe, expect, it } from "vitest";
import { compareRoutingSnapshots } from "./routingDiff";

describe("Routing Diff", () => {
  it("compares additions, removals, and modifications with incomplete arrays handled safely", () => {
    const differences = compareRoutingSnapshots(
      { channels: [{ index: 1, name: "Lead", gain: 0, routes: [{ group: "bus", index: 1 }] }, { index: 2, name: "Old" }], buses: [{ index: 1, name: "Bus 1" }] },
      { channels: [{ index: 1, name: "Lead", gain: 3, routes: [{ group: "bus", index: 2 }] }, { index: 3, name: "New" }], matrices: [{ index: 1, name: "Matrix 1" }] },
    );
    expect(differences).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "modified", name: "Lead", newValue: expect.stringContaining("Gain: 0.0dB → 3.0dB") }),
      expect.objectContaining({ type: "removed", category: "Channel", name: "Old" }),
      expect.objectContaining({ type: "added", category: "Channel", name: "New" }),
      expect.objectContaining({ type: "removed", category: "Bus", name: "Bus 1" }),
      expect.objectContaining({ type: "added", category: "Matrix", name: "Matrix 1" }),
    ]));
  });
});

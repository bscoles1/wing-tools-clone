import { describe, expect, it } from "vitest";
import { lintSnapshot } from "./snapshotLinter";

describe("lintSnapshot", () => {
  it("returns diagnostic results for a complete normalized snapshot", () => {
    const issues = lintSnapshot({
      inputs: [{ group: "LCL", index: 1, name: "Kick" }, { group: "LCL", index: 2, name: "Spare" }],
      channels: [
        { index: 1, name: "Kick", inputSource: { group: "LCL", index: 1 }, routes: [{ destination: "bus", index: 1 }], gain: 8 },
        { index: 2, name: "Unused Channel", routes: [] },
      ],
      buses: [{ index: 1, name: "Drums", routes: [] }],
      matrices: [{ index: 1, name: "Broadcast", routes: [] }],
    });

    expect(issues.map((issue) => issue.rule)).toEqual(expect.arrayContaining([
      "Unpatched Channels",
      "Unrouted Channels",
      "Unrouted Buses",
      "Unrouted Matrices",
      "Unused Inputs",
      "High Gain Levels",
    ]));
  });

  it("safely analyzes a legacy snapshot missing routes and collections", () => {
    expect(() => lintSnapshot({ channels: [{ index: 1, name: "Legacy Channel" }] })).not.toThrow();

    const issues = lintSnapshot({ channels: [{ index: 1, name: "Legacy Channel" }] });
    expect(issues.map((issue) => issue.rule)).toEqual(expect.arrayContaining([
      "Incomplete Snapshot Data",
      "Unpatched Channels",
      "Unrouted Channels",
    ]));
  });
});

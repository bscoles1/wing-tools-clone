import { describe, expect, it } from "vitest";
import type { WingMixerSnapshot } from "../parsers/wingParser";
import { buildRoutingSourceSummaries, formatPatchSource } from "./sourceSummary";

const fixture: WingMixerSnapshot = {
  metadata: {},
  inputs: [{ id: "AES50A_3", name: "Kick Mic", group: "AES50A", index: 3 }],
  channels: [{ id: "CH1", index: 1, name: "KICK", inputSource: { group: "AES50A", index: 3 }, routes: [{ destination: "bus", group: "bus", index: 1 }, { destination: "matrix", group: "matrix", index: 1 }], offRoutes: [] }],
  buses: [{ id: "BUS1", index: 1, name: "Drum Mix", isMono: true, routes: [{ destination: "matrix", group: "matrix", index: 1 }, { destination: "output", group: "output", index: 1 }], offRoutes: [] }],
  matrices: [{ id: "MTX1", index: 1, name: "Lobby Feed", isMono: true, routes: [{ destination: "output", group: "output", index: 1 }], offRoutes: [] }],
  outputs: [{ id: "LCL_1", name: "Lobby Speaker", group: "LCL", index: 1, source: { group: "main", index: 1 } }],
  summary: { totalInputs: 1, totalOutputs: 1, totalChannels: 1, activeRoutes: 4 },
};

describe("routing source summaries", () => {
  it("formats physical source addresses", () => {
    expect(formatPatchSource({ group: "AES50A", index: 3 })).toBe("AES50A 3");
    expect(formatPatchSource()).toBe("No source assigned");
  });

  it("resolves upstream source information for all routing entities", () => {
    const summary = buildRoutingSourceSummaries(fixture);
    expect(summary.channelSources.get(1)).toBe("Input · AES50A 3");
    expect(summary.busSources.get(1)).toContain("CH 1 · KICK");
    expect(summary.matrixSources.get(1)).toContain("Bus 1 · Drum Mix");
    expect(summary.outputSources.get("LCL_1")).toContain("Matrix 1 · Lobby Feed");
  });
});

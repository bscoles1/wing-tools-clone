import { describe, expect, it } from "vitest";
import { MAX_MIND_MAP_ZOOM, MIN_MIND_MAP_ZOOM, changeMindMapZoom, clampMindMapZoom, filterMindMapNodes, getFocusedMindMapNodeIds, getMindMapSourceOptions } from "./mindMapNavigation";

const nodes = [
  { id: "input:AES50A:1", type: "input" as const, name: "Kick", group: "AES50A", configuredSource: "AES50A 1", incoming: [], outgoing: ["channel:1"] },
  { id: "input:Local:2", type: "input" as const, name: "Talkback", group: "Local", configuredSource: "Local 2", incoming: [], outgoing: ["channel:2"] },
  { id: "bus:1", type: "bus" as const, name: "Wedge", incoming: ["channel:1"], outgoing: [] },
];

describe("mind-map navigation helpers", () => {
  it("bounds explicit zoom controls", () => {
    expect(clampMindMapZoom(0.1)).toBe(MIN_MIND_MAP_ZOOM);
    expect(clampMindMapZoom(4)).toBe(MAX_MIND_MAP_ZOOM);
    expect(changeMindMapZoom(1, "in")).toBe(1.1);
    expect(changeMindMapZoom(1, "out")).toBe(0.9);
  });

  it("filters a branch by search and source group", () => {
    expect(getMindMapSourceOptions(nodes)).toEqual(["AES50A", "Derived mix", "Local"]);
    expect(filterMindMapNodes(nodes, "talk", "all").map((node) => node.id)).toEqual(["input:Local:2"]);
    expect(filterMindMapNodes(nodes, "", "AES50A").map((node) => node.id)).toEqual(["input:AES50A:1"]);
  });

  it("isolates the selected trace only while focus mode is enabled", () => {
    const trace = new Map([["input:AES50A:1", "upstream" as const], ["channel:1", "selected" as const]]);
    expect(getFocusedMindMapNodeIds(trace, "channel:1", false)).toBeNull();
    expect(Array.from(getFocusedMindMapNodeIds(trace, "channel:1", true) || [])).toEqual(["input:AES50A:1", "channel:1"]);
  });
});

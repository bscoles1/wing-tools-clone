import { describe, expect, it } from "vitest";
import { buildPatchFlowConnections, buildPatchFlowGroups, filterPatchFlowEntities, getActivePatchFlowEntities, getPatchFlowSourceOptions, limitPatchFlowEntities, type PatchFlowEntity } from "./patchFlowGraph";

const input: PatchFlowEntity = { id: "input:AES50A:1", type: "input", name: "Kick", index: 1, group: "AES50A", configuredSource: "AES50A 1", incoming: [], outgoing: ["channel:1"] };
const channel: PatchFlowEntity = { id: "channel:1", type: "channel", name: "Kick Ch", index: 1, configuredSource: "AES50A 1", incoming: [input.id], outgoing: ["bus:1"] };
const bus: PatchFlowEntity = { id: "bus:1", type: "bus", name: "Wedge", index: 1, incoming: [channel.id], outgoing: ["output:AES50A:2"] };
const output: PatchFlowEntity = { id: "output:AES50A:2", type: "output", name: "Wedge Out", index: 2, group: "AES50A", configuredSource: "bus 1", incoming: [bus.id], outgoing: [] };
const entities = [input, channel, bus, output];

describe("patch-flow graph helpers", () => {
  it("groups WING entities into source, channel, mix, and output lanes", () => {
    const groups = buildPatchFlowGroups(entities);
    expect(groups.map((group) => group.id)).toEqual(["inputs:AES50A", "channels", "buses", "outputs:AES50A"]);
    expect(groups.find((group) => group.id === "channels")?.entities).toEqual([channel]);
  });

  it("can dynamically reflow the same routing inventory into a compact left-to-right topology", () => {
    const groups = buildPatchFlowGroups(entities, "compact");
    expect(groups.find((group) => group.id === "inputs:AES50A")?.x).toBeLessThan(groups.find((group) => group.id === "channels")?.x ?? 0);
    expect(groups.find((group) => group.id === "channels")?.x).toBeLessThan(groups.find((group) => group.id === "buses")?.x ?? 0);
    expect(groups.find((group) => group.id === "buses")?.x).toBeLessThan(groups.find((group) => group.id === "outputs:AES50A")?.x ?? 0);
  });

  it("filters patch entities by text, source group, and entity type", () => {
    expect(getPatchFlowSourceOptions(entities)).toEqual(["AES50A", "bus", "Unassigned"]);
    expect(filterPatchFlowEntities(entities, "wedge", "all", "all").map((entity) => entity.id)).toEqual([bus.id, output.id]);
    expect(filterPatchFlowEntities(entities, "", "AES50A", "input").map((entity) => entity.id)).toEqual([input.id]);
  });

  it("builds visible patch cables and isolates a focused route", () => {
    const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
    const groups = buildPatchFlowGroups(entities);
    const trace = new Map([[input.id, "upstream" as const], [channel.id, "selected" as const], [bus.id, "downstream" as const], [output.id, "downstream" as const]]);
    expect(buildPatchFlowConnections(entityMap, groups, new Set(entities.map((entity) => entity.id)), trace, false)).toHaveLength(3);
    expect(buildPatchFlowConnections(entityMap, groups, new Set(entities.map((entity) => entity.id)), trace, true)).toHaveLength(3);
  });

  it("keeps the default canvas focused on active patches and caps oversized device groups", () => {
    const idle = { ...input, id: "input:AES50A:99", incoming: [], outgoing: [] };
    expect(getActivePatchFlowEntities([...entities, idle]).map((entity) => entity.id)).not.toContain(idle.id);
    expect(limitPatchFlowEntities([input, idle], 1).map((entity) => entity.id)).toEqual([input.id]);
  });
});

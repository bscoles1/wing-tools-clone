import { describe, expect, it } from "vitest";
import { getNodeGroupLabel, getNodeSourceLabel, getSelectedPathRoles, type SignalFlowNode } from "./signalFlowTrace";

function createNode(id: string, type: SignalFlowNode["type"], name: string, incoming: string[] = [], outgoing: string[] = [], group?: string): SignalFlowNode {
  return { id, type, name, incoming, outgoing, group };
}

describe("Signal Flow context and tracing", () => {
  const nodes = new Map<string, SignalFlowNode>([
    ["input:local:1", { ...createNode("input:local:1", "input", "Kick Mic", [], ["channel:1"], "Local"), configuredSource: "Local 1" }],
    ["channel:1", { ...createNode("channel:1", "channel", "KICK", ["input:local:1"], ["bus:1"]), configuredSource: "Local 1" }],
    ["bus:1", createNode("bus:1", "bus", "Drum Bus", ["channel:1"], ["matrix:1"], "Monitor")],
    ["matrix:1", createNode("matrix:1", "matrix", "Lobby Matrix", ["bus:1"], ["output:local:1"])],
    ["output:local:1", createNode("output:local:1", "output", "Wedge 1", ["matrix:1"], [], "Local")],
  ]);

  it("provides readable group and source context", () => {
    expect(getNodeGroupLabel(nodes.get("bus:1")!)).toBe("Monitor");
    expect(getNodeSourceLabel(nodes.get("input:local:1")!, nodes)).toBe("Physical source · Local 1");
    expect(getNodeSourceLabel(nodes.get("channel:1")!, nodes)).toBe("Input source · Local 1 · Kick Mic");
    expect(getNodeSourceLabel(nodes.get("bus:1")!, nodes)).toBe("Bus sources · KICK");
    expect(getNodeSourceLabel(nodes.get("matrix:1")!, nodes)).toBe("Matrix sources · Drum Bus");
    expect(getNodeSourceLabel(nodes.get("output:local:1")!, nodes)).toBe("Output feed · Lobby Matrix");
    expect(getNodeSourceLabel(createNode("channel:2", "channel", "SN"), nodes)).toBe("Input source · none assigned");
  });

  it("traces all ancestors and descendants from a selected node", () => {
    expect(Object.fromEntries(getSelectedPathRoles(nodes, "channel:1"))).toEqual({
      "channel:1": "selected",
      "input:local:1": "upstream",
      "bus:1": "downstream",
      "matrix:1": "downstream",
      "output:local:1": "downstream",
    });
  });
});

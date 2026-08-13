import { describe, expect, it } from "vitest";
import { getNodeGroupLabel, getNodeSourceLabel, getSelectedPathRoles, type SignalFlowNode } from "./signalFlowTrace";

function createNode(id: string, type: SignalFlowNode["type"], name: string, incoming: string[] = [], outgoing: string[] = [], group?: string): SignalFlowNode {
  return { id, type, name, incoming, outgoing, group };
}

describe("Signal Flow context and tracing", () => {
  const nodes = new Map<string, SignalFlowNode>([
    ["input:local:1", createNode("input:local:1", "input", "Kick Mic", [], ["channel:1"], "Local")],
    ["channel:1", createNode("channel:1", "channel", "KICK", ["input:local:1"], ["bus:1"])],
    ["bus:1", createNode("bus:1", "bus", "Drum Bus", ["channel:1"], ["output:local:1"], "Monitor")],
    ["output:local:1", createNode("output:local:1", "output", "Wedge 1", ["bus:1"], [], "Local")],
  ]);

  it("provides readable group and source context", () => {
    expect(getNodeGroupLabel(nodes.get("bus:1")!)).toBe("Monitor");
    expect(getNodeSourceLabel(nodes.get("channel:1")!, nodes)).toBe("From Kick Mic");
    expect(getNodeSourceLabel(createNode("channel:2", "channel", "SN"), nodes)).toBe("No source assigned");
  });

  it("traces all ancestors and descendants from a selected node", () => {
    expect(Object.fromEntries(getSelectedPathRoles(nodes, "channel:1"))).toEqual({
      "channel:1": "selected",
      "input:local:1": "upstream",
      "bus:1": "downstream",
      "output:local:1": "downstream",
    });
  });
});

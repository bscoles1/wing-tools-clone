import { describe, expect, it } from "vitest";
import { getNextVisibleNodeCount, getVisibleBranchNodes } from "./SignalFlowDiagram";

describe("getNextVisibleNodeCount", () => {
  it("reveals a single additional branch batch", () => {
    expect(getNextVisibleNodeCount(12, 40)).toBe(24);
  });

  it("does not exceed the number of nodes in the branch", () => {
    expect(getNextVisibleNodeCount(36, 40)).toBe(40);
    expect(getNextVisibleNodeCount(40, 40)).toBe(40);
  });

  it("returns every remaining node after choosing Show all", () => {
    const nodes = Array.from({ length: 40 }, (_, index) => `node-${index + 1}`);
    const revealAllCount = nodes.length;

    expect(getVisibleBranchNodes(nodes, false, 12)).toEqual([]);
    expect(getVisibleBranchNodes(nodes, true, 12)).toHaveLength(12);
    expect(getVisibleBranchNodes(nodes, true, revealAllCount)).toEqual(nodes);
  });
});

// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrgChartNode, type FlowNode } from "./SignalFlowDiagram";

afterEach(cleanup);

function createNode(overrides: Partial<FlowNode>): FlowNode {
  return {
    id: "channel:1",
    type: "channel",
    name: "KICK",
    index: 1,
    incoming: ["input:local:1"],
    outgoing: ["bus:1"],
    ...overrides,
  };
}

describe("OrgChartNode", () => {
  it("renders source and group context labels for a selected node", () => {
    const source = createNode({ id: "input:local:1", type: "input", name: "Kick Mic", index: 1, group: "Local", incoming: [], outgoing: ["channel:1"] });
    const channel = createNode({ group: "Drums" });
    const nodeMap = new Map<string, FlowNode>([[source.id, source], [channel.id, channel]]);

    render(<OrgChartNode node={channel} nodeMap={nodeMap} selected pathRole="selected" hasActiveTrace onSelect={vi.fn()} />);

    expect(screen.getByText("Group · Drums")).toBeTruthy();
    expect(screen.getByText("From Kick Mic")).toBeTruthy();
    expect(screen.getByRole("button", { name: /KICK/ }).className).toContain("ring-2");
  });

  it("applies focused-path and muted-context visual states", () => {
    const node = createNode({});
    const nodeMap = new Map<string, FlowNode>([[node.id, node]]);
    const { rerender } = render(<OrgChartNode node={node} nodeMap={nodeMap} selected={false} pathRole="upstream" hasActiveTrace onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: /KICK/ }).className).toContain("border-emerald-400");

    rerender(<OrgChartNode node={node} nodeMap={nodeMap} selected={false} hasActiveTrace onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /KICK/ }).className).toContain("opacity-40");
  });
});

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
    const source = createNode({ id: "input:local:1", type: "input", name: "Kick Mic", index: 1, group: "Local", configuredSource: "Local 1", incoming: [], outgoing: ["channel:1"] });
    const channel = createNode({ group: "Drums", configuredSource: "Local 1" });
    const nodeMap = new Map<string, FlowNode>([[source.id, source], [channel.id, channel]]);

    render(<OrgChartNode node={channel} nodeMap={nodeMap} selected pathRole="selected" hasActiveTrace onSelect={vi.fn()} />);

    expect(screen.getByText("Group · Drums")).toBeTruthy();
    expect(screen.getByText("Input source · Local 1 · Kick Mic")).toBeTruthy();
    expect(screen.getByRole("button", { name: /KICK/ }).className).toContain("ring-2");
  });

  it("renders explicit source labels for physical inputs, buses, matrices, and outputs", () => {
    const input = createNode({ id: "input:local:1", type: "input", name: "Kick Mic", index: 1, group: "Local", incoming: [], outgoing: ["channel:1"] });
    const channel = createNode({ id: "channel:1", type: "channel", name: "KICK", index: 1, incoming: [input.id], outgoing: ["bus:1"] });
    const bus = createNode({ id: "bus:1", type: "bus", name: "Drum Bus", index: 1, incoming: [channel.id], outgoing: ["matrix:1"] });
    const matrix = createNode({ id: "matrix:1", type: "matrix", name: "Lobby Matrix", index: 1, incoming: [bus.id], outgoing: ["output:local:1"] });
    const output = createNode({ id: "output:local:1", type: "output", name: "Lobby Speaker", index: 1, group: "Local", incoming: [matrix.id], outgoing: [] });
    const nodeMap = new Map<string, FlowNode>([[input.id, input], [channel.id, channel], [bus.id, bus], [matrix.id, matrix], [output.id, output]]);

    render(<div><OrgChartNode node={input} nodeMap={nodeMap} selected={false} hasActiveTrace={false} onSelect={vi.fn()} /><OrgChartNode node={bus} nodeMap={nodeMap} selected={false} hasActiveTrace={false} onSelect={vi.fn()} /><OrgChartNode node={matrix} nodeMap={nodeMap} selected={false} hasActiveTrace={false} onSelect={vi.fn()} /><OrgChartNode node={output} nodeMap={nodeMap} selected={false} hasActiveTrace={false} onSelect={vi.fn()} /></div>);

    expect(screen.getByText("Physical source · Local")).toBeTruthy();
    expect(screen.getByText("Bus sources · KICK")).toBeTruthy();
    expect(screen.getByText("Matrix sources · Drum Bus")).toBeTruthy();
    expect(screen.getByText("Output feed · Lobby Matrix")).toBeTruthy();
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

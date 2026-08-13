// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PatchFlowCanvas from "./PatchFlowCanvas";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children, nodes, nodeTypes, edges }: any) => <div data-testid="react-flow"><span data-testid="edge-count">{edges.length}</span>{nodes.map((node: any) => {
    const Component = nodeTypes[node.type];
    return <Component key={node.id} id={node.id} data={node.data} />;
  })}{children}</div>,
  Background: () => null,
  Controls: () => <div data-testid="canvas-controls" />,
  MiniMap: () => <div data-testid="canvas-minimap" />,
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom" },
  MarkerType: { ArrowClosed: "arrowclosed" },
  BackgroundVariant: { Dots: "dots" },
}));

afterEach(cleanup);

const input = { id: "input:AES50A:1", type: "input" as const, name: "Kick", index: 1, group: "AES50A", configuredSource: "AES50A 1", incoming: [], outgoing: ["channel:1"] };
const channel = { id: "channel:1", type: "channel" as const, name: "Kick Ch", index: 1, configuredSource: "AES50A 1", incoming: [input.id], outgoing: ["bus:1"] };
const bus = { id: "bus:1", type: "bus" as const, name: "Wedge", index: 1, incoming: [channel.id], outgoing: ["output:AES50A:2"] };
const output = { id: "output:AES50A:2", type: "output" as const, name: "Wedge Out", index: 2, group: "AES50A", configuredSource: "bus 1", incoming: [bus.id], outgoing: [] };
const idle = { id: "input:AES50A:99", type: "input" as const, name: "Unused", index: 99, group: "AES50A", configuredSource: "AES50A 99", incoming: [], outgoing: [] };

function renderCanvas(overrides: Partial<React.ComponentProps<typeof PatchFlowCanvas>> = {}) {
  const onSelectNode = vi.fn();
  const onToggleFocus = vi.fn();
  const rendered = render(<PatchFlowCanvas entities={[input, channel, bus, output, idle]} selectedNodeId={channel.id} traceRoles={new Map([[input.id, "upstream"], [channel.id, "selected"], [bus.id, "downstream"], [output.id, "downstream"]])} focusedNodeIds={null} focusEnabled={false} onSelectNode={onSelectNode} onToggleFocus={onToggleFocus} onClearFocus={vi.fn()} {...overrides} />);
  return { onSelectNode, onToggleFocus, ...rendered };
}

describe("PatchFlowCanvas", () => {
  it("renders grouped patch blocks, routed cables, navigation controls, and a minimap", () => {
    renderCanvas();
    expect(screen.getByText("AES50A Inputs")).toBeTruthy();
    expect(screen.getByText("Mixer Inputs")).toBeTruthy();
    expect(screen.getByText("Mixer Buses")).toBeTruthy();
    expect(screen.getByText("AES50A Outputs")).toBeTruthy();
    expect(screen.getByTestId("edge-count").textContent).toBe("3");
    expect(screen.getByTestId("canvas-controls")).toBeTruthy();
    expect(screen.getByTestId("canvas-minimap")).toBeTruthy();
  });

  it("searches patches and filters the rendered endpoint blocks by source group and entity type", () => {
    renderCanvas();
    fireEvent.change(screen.getByLabelText("Search patch flow"), { target: { value: "wedge" } });
    expect(screen.getByText("Wedge")).toBeTruthy();
    expect(screen.getByText("Wedge Out")).toBeTruthy();
    expect(screen.queryByText("Kick Ch")).toBeNull();
    fireEvent.change(screen.getByLabelText("Search patch flow"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filter patch flow by source"), { target: { value: "AES50A" } });
    expect(screen.getByText("Kick")).toBeTruthy();
    expect(screen.getByText("Kick Ch")).toBeTruthy();
    expect(screen.queryByText("Wedge")).toBeNull();
    fireEvent.change(screen.getByLabelText("Filter patch flow by source"), { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText("Filter patch flow by entity type"), { target: { value: "bus" } });
    expect(screen.getByText("Wedge")).toBeTruthy();
  });

  it("uses selected-route focus to remove unrelated rendered endpoints and cables", () => {
    const otherBus = { id: "bus:99", type: "bus" as const, name: "Other Bus", index: 99, incoming: [], outgoing: ["output:AES50A:3"] };
    const otherOutput = { id: "output:AES50A:3", type: "output" as const, name: "Other Output", index: 3, group: "AES50A", configuredSource: "bus 99", incoming: [otherBus.id], outgoing: [] };
    const entities = [input, channel, bus, output, otherBus, otherOutput];
    const traceRoles = new Map([[input.id, "upstream" as const], [channel.id, "selected" as const], [bus.id, "downstream" as const], [output.id, "downstream" as const]]);
    const { onSelectNode, onToggleFocus, rerender } = renderCanvas({ entities, traceRoles });
    expect(screen.getByText("Other Bus")).toBeTruthy();
    expect(screen.getByTestId("edge-count").textContent).toBe("4");
    fireEvent.click(screen.getByText("Focus selected route"));
    fireEvent.click(screen.getByText("Kick"));
    expect(onToggleFocus).toHaveBeenCalledTimes(1);
    expect(onSelectNode).toHaveBeenCalledWith(input.id);
    rerender(<PatchFlowCanvas entities={entities} selectedNodeId={channel.id} traceRoles={traceRoles} focusedNodeIds={new Set([input.id, channel.id, bus.id, output.id])} focusEnabled onSelectNode={onSelectNode} onToggleFocus={onToggleFocus} onClearFocus={vi.fn()} />);
    expect(screen.queryByText("Other Bus")).toBeNull();
    expect(screen.queryByText("Other Output")).toBeNull();
    expect(screen.getByTestId("edge-count").textContent).toBe("3");
  });
});

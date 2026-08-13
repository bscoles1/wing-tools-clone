// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MindMapBranch, type FlowNode } from "./SignalFlowDiagram";

afterEach(cleanup);

const kick: FlowNode = { id: "input:AES50A:1", type: "input", name: "Kick Mic", index: 1, group: "AES50A", configuredSource: "AES50A 1", incoming: [], outgoing: ["channel:1"] };
const talkback: FlowNode = { id: "input:Local:2", type: "input", name: "Talkback", index: 2, group: "Local", configuredSource: "Local 2", incoming: [], outgoing: ["channel:2"] };
const nodeMap = new Map<string, FlowNode>([[kick.id, kick], [talkback.id, talkback]]);

function renderBranch(overrides: Partial<React.ComponentProps<typeof MindMapBranch>> = {}) {
  const onFilterChange = vi.fn();
  render(<MindMapBranch branchKey="inputs" nodes={[kick, talkback]} expanded onToggle={vi.fn()} nodeMap={nodeMap} selectedNodeId={null} traceRoles={new Map()} setSelectedNodeId={vi.fn()} filter={{ query: "", sourceGroup: "all" }} onFilterChange={onFilterChange} focusedNodeIds={null} {...overrides} />);
  return { onFilterChange };
}

describe("MindMapBranch", () => {
  it("shows matching source nodes and provides search and source controls", () => {
    renderBranch();
    expect(screen.getByText("Kick Mic")).toBeTruthy();
    expect(screen.getByText("Talkback")).toBeTruthy();
    expect(screen.getByLabelText("Search Physical Inputs")).toBeTruthy();
    expect(screen.getByLabelText("Filter Physical Inputs by source")).toBeTruthy();
  });

  it("reports per-branch search and source filter changes", () => {
    const { onFilterChange } = renderBranch();
    fireEvent.change(screen.getByLabelText("Search Physical Inputs"), { target: { value: "kick" } });
    fireEvent.change(screen.getByLabelText("Filter Physical Inputs by source"), { target: { value: "AES50A" } });
    expect(onFilterChange).toHaveBeenNthCalledWith(1, { query: "kick" });
    expect(onFilterChange).toHaveBeenNthCalledWith(2, { sourceGroup: "AES50A" });
  });

  it("isolates only focused-route nodes within a branch", () => {
    renderBranch({ focusedNodeIds: new Set([kick.id]) });
    expect(screen.getByText("Kick Mic")).toBeTruthy();
    expect(screen.queryByText("Talkback")).toBeNull();
    expect(screen.getByText("1/2")).toBeTruthy();
  });
});

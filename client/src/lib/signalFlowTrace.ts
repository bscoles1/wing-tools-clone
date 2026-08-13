export type SignalFlowNode = {
  id: string;
  type: "input" | "channel" | "bus" | "matrix" | "output";
  name: string;
  group?: string;
  configuredSource?: string;
  incoming: string[];
  outgoing: string[];
};

export type TraceRole = "selected" | "upstream" | "downstream";

export function getNodeGroupLabel(node: SignalFlowNode): string {
  if (node.group) return node.group;
  return {
    input: "Physical I/O",
    channel: "Mixer channel strip",
    bus: "Mix bus",
    matrix: "Matrix mix",
    output: "Physical I/O",
  }[node.type];
}

export function getNodeSourceLabel(node: SignalFlowNode, nodeMap: Map<string, SignalFlowNode>): string {
  if (node.type === "input") return `Physical source · ${node.configuredSource || node.group || "I/O"}`;

  const sources = node.incoming
    .map((id) => nodeMap.get(id))
    .filter((candidate): candidate is SignalFlowNode => Boolean(candidate))
    .map((candidate) => candidate.name)
    .slice(0, 2);

  const prefix = { channel: "Input source", bus: "Bus sources", matrix: "Matrix sources", output: "Output feed" }[node.type];
  const configured = node.configuredSource ? [node.configuredSource] : [];
  const details = [...configured, ...sources];
  if (details.length === 0) return node.type === "channel" ? "Input source · none assigned" : `${prefix} · none detected`;
  return `${prefix} · ${details.join(" · ")}${node.incoming.length > sources.length ? ` +${node.incoming.length - sources.length}` : ""}`;
}

export function getSelectedPathRoles(nodeMap: Map<string, SignalFlowNode>, selectedNodeId: string | null): Map<string, TraceRole> {
  const roles = new Map<string, TraceRole>();
  if (!selectedNodeId || !nodeMap.has(selectedNodeId)) return roles;

  roles.set(selectedNodeId, "selected");

  const addConnectedNodes = (nodeId: string, direction: "incoming" | "outgoing", role: TraceRole, visited = new Set<string>()) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) return;

    for (const connectedId of node[direction]) {
      if (connectedId !== selectedNodeId && !roles.has(connectedId)) roles.set(connectedId, role);
      addConnectedNodes(connectedId, direction, role, visited);
    }
  };

  addConnectedNodes(selectedNodeId, "incoming", "upstream");
  addConnectedNodes(selectedNodeId, "outgoing", "downstream");
  return roles;
}

export function getFocusedSignalFlowNodeIds(traceRoles: Map<string, TraceRole>, selectedNodeId: string | null, focusEnabled: boolean): Set<string> | null {
  if (!focusEnabled || !selectedNodeId || traceRoles.size === 0) return null;
  return new Set(traceRoles.keys());
}

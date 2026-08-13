import type { SignalFlowNode, TraceRole } from "./signalFlowTrace";

export const MIN_MIND_MAP_ZOOM = 0.6;
export const MAX_MIND_MAP_ZOOM = 1.5;
export const MIND_MAP_ZOOM_STEP = 0.1;

export type MindMapFilterNode = SignalFlowNode & {
  configuredSource?: string;
};

export function clampMindMapZoom(value: number) {
  return Math.min(MAX_MIND_MAP_ZOOM, Math.max(MIN_MIND_MAP_ZOOM, Number(value.toFixed(2))));
}

export function changeMindMapZoom(currentZoom: number, direction: "in" | "out") {
  return clampMindMapZoom(currentZoom + (direction === "in" ? MIND_MAP_ZOOM_STEP : -MIND_MAP_ZOOM_STEP));
}

export function getMindMapSourceGroup(node: MindMapFilterNode) {
  if (node.configuredSource) return node.configuredSource.split(/\s+/)[0] || "Unassigned";
  return node.group || (node.type === "bus" || node.type === "matrix" ? "Derived mix" : "Unassigned");
}

export function getMindMapSourceOptions(nodes: MindMapFilterNode[]) {
  return Array.from(new Set(nodes.map(getMindMapSourceGroup))).sort((left, right) => left.localeCompare(right));
}

export function filterMindMapNodes<T extends MindMapFilterNode>(nodes: T[], query: string, sourceGroup: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return nodes.filter((node) => {
    const matchesSource = sourceGroup === "all" || getMindMapSourceGroup(node) === sourceGroup;
    if (!matchesSource) return false;
    if (!normalizedQuery) return true;
    return [node.name, node.group, node.configuredSource, node.id, getMindMapSourceGroup(node)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
}

export function getFocusedMindMapNodeIds(traceRoles: Map<string, TraceRole>, selectedNodeId: string | null, focusEnabled: boolean) {
  if (!focusEnabled || !selectedNodeId) return null;
  return new Set(traceRoles.keys());
}

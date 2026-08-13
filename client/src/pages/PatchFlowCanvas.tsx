import { Button } from "@/components/ui/button";
import { buildPatchFlowConnections, buildPatchFlowGroups, filterPatchFlowEntities, getActivePatchFlowEntities, getPatchFlowSourceOptions, limitPatchFlowEntities, type PatchEntityType, type PatchFlowEntity, type PatchFlowGroup } from "@/lib/patchFlowGraph";
import type { TraceRole } from "@/lib/signalFlowTrace";
import { Background, BackgroundVariant, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Focus, Search, SlidersHorizontal, X } from "lucide-react";
import React, { useMemo, useState } from "react";

type GroupNodeData = PatchFlowGroup & {
  selectedNodeId: string | null;
  traceRoles: Map<string, TraceRole>;
  focusEnabled: boolean;
  onSelectEntity: (id: string) => void;
};

type PatchFlowCanvasProps = {
  entities: PatchFlowEntity[];
  selectedNodeId: string | null;
  traceRoles: Map<string, TraceRole>;
  focusedNodeIds: Set<string> | null;
  focusEnabled: boolean;
  onSelectNode: (id: string) => void;
  onToggleFocus: () => void;
  onClearFocus: () => void;
};

const groupTokens: Record<PatchFlowGroup["lane"], { shell: string; header: string; chip: string; accent: string }> = {
  source: { shell: "border-emerald-200 bg-emerald-50/85", header: "text-emerald-950", chip: "border-emerald-200 bg-white text-emerald-950 hover:border-emerald-400", accent: "#10b981" },
  channel: { shell: "border-blue-200 bg-blue-50/85", header: "text-blue-950", chip: "border-blue-200 bg-white text-blue-950 hover:border-blue-400", accent: "#3b82f6" },
  mix: { shell: "border-violet-200 bg-violet-50/85", header: "text-violet-950", chip: "border-violet-200 bg-white text-violet-950 hover:border-violet-400", accent: "#8b5cf6" },
  output: { shell: "border-rose-200 bg-rose-50/85", header: "text-rose-950", chip: "border-rose-200 bg-white text-rose-950 hover:border-rose-400", accent: "#f43f5e" },
};

function endpointPosition(index: number, length: number) {
  return `${Math.round(((index + 1) / (length + 1)) * 100)}%`;
}

function PatchGroupNode({ data }: NodeProps<Node<GroupNodeData>>) {
  const tokens = groupTokens[data.lane];
  return <div className={`min-w-[320px] rounded-xl border p-3 shadow-sm backdrop-blur ${tokens.shell}`}>
    <div className="mb-2 flex items-start justify-between gap-3"><div><p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${tokens.header}`}>{data.title}</p><p className="mt-0.5 text-[10px] text-slate-500">{data.subtitle}</p></div><span className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-bold text-slate-600">{data.entities.length}</span></div>
    <div className="grid max-h-44 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
      {data.entities.map((entity, index) => {
        const role = data.traceRoles.get(entity.id);
        const selected = entity.id === data.selectedNodeId;
        const traced = Boolean(role);
        const dimmed = data.focusEnabled && !traced;
        const chipClass = selected ? "ring-2 ring-indigo-500 ring-offset-1" : role === "upstream" ? "ring-2 ring-emerald-400 ring-offset-1" : role === "downstream" ? "ring-2 ring-sky-400 ring-offset-1" : "";
        return <button key={entity.id} type="button" onClick={() => data.onSelectEntity(entity.id)} title={`${entity.name} · ${entity.configuredSource || entity.group || "No source"}`} className={`relative min-w-0 rounded-md border px-2 py-1.5 text-left text-[10px] font-semibold transition ${tokens.chip} ${chipClass} ${dimmed ? "opacity-25" : ""}`}><Handle type="target" position={Position.Top} id={`in-${entity.id}`} style={{ left: endpointPosition(index, data.entities.length), opacity: 0 }} /><span className="block truncate">{entity.name || `${entity.type} ${entity.index}`}</span><span className="mt-0.5 block truncate text-[9px] font-medium opacity-55">{entity.configuredSource || entity.group || `#${entity.index}`}</span><Handle type="source" position={Position.Bottom} id={`out-${entity.id}`} style={{ left: endpointPosition(index, data.entities.length), opacity: 0 }} /></button>;
      })}
    </div>
  </div>;
}

const nodeTypes = { patchGroup: PatchGroupNode };

export default function PatchFlowCanvas({ entities, selectedNodeId, traceRoles, focusedNodeIds, focusEnabled, onSelectNode, onToggleFocus, onClearFocus }: PatchFlowCanvasProps) {
  const [query, setQuery] = useState("");
  const [sourceGroup, setSourceGroup] = useState("all");
  const [entityType, setEntityType] = useState<"all" | PatchEntityType>("all");
  const [showAllPatches, setShowAllPatches] = useState(false);
  const sourceOptions = useMemo(() => getPatchFlowSourceOptions(entities), [entities]);
  const hasExplicitFilter = Boolean(query || sourceGroup !== "all" || entityType !== "all");
  const filteredEntities = useMemo(() => {
    const candidateEntities = hasExplicitFilter || showAllPatches ? entities : getActivePatchFlowEntities(entities);
    const matches = filterPatchFlowEntities(candidateEntities, query, sourceGroup, entityType);
    const focusedMatches = focusedNodeIds ? matches.filter((entity) => focusedNodeIds.has(entity.id)) : matches;
    return limitPatchFlowEntities(focusedMatches);
  }, [entities, entityType, focusedNodeIds, hasExplicitFilter, query, showAllPatches, sourceGroup]);
  const groups = useMemo(() => buildPatchFlowGroups(filteredEntities), [filteredEntities]);
  const entityMap = useMemo(() => new Map(filteredEntities.map((entity) => [entity.id, entity])), [filteredEntities]);
  const visibleEntityIds = useMemo(() => new Set(filteredEntities.map((entity) => entity.id)), [filteredEntities]);
  const nodes = useMemo<Node[]>(() => groups.map((group) => ({
    id: group.id,
    type: "patchGroup",
    position: { x: group.x, y: group.y },
    data: { ...group, selectedNodeId, traceRoles, focusEnabled, onSelectEntity: onSelectNode },
    draggable: false,
    selectable: false,
    style: { width: group.entities.length > 24 ? 660 : group.entities.length > 12 ? 480 : 360 },
  })), [focusEnabled, groups, onSelectNode, selectedNodeId, traceRoles]);
  const edges = useMemo<Edge[]>(() => buildPatchFlowConnections(entityMap, groups, visibleEntityIds, traceRoles, focusEnabled).map((connection, index) => ({
    id: `${connection.source}-${connection.target}-${index}`,
    source: connection.sourceGroup,
    target: connection.targetGroup,
    sourceHandle: `out-${connection.source}`,
    targetHandle: `in-${connection.target}`,
    type: "smoothstep",
    animated: connection.active,
    style: { stroke: connection.active ? connection.color : "#94a3b8", strokeWidth: connection.active ? 2.5 : 1.1, opacity: connection.active ? 0.95 : 0.46 },
    markerEnd: connection.active ? { type: MarkerType.ArrowClosed, color: connection.color, width: 14, height: 14 } : undefined,
  })), [entityMap, focusEnabled, groups, traceRoles, visibleEntityIds]);
  const hasFilters = Boolean(query || sourceGroup !== "all" || entityType !== "all");

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950" data-testid="patch-flow-canvas">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Patch Flow Diagram</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Grouped patch points with visible source-to-destination cable paths.</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{filteredEntities.length} visible patches</span><Button size="sm" variant={showAllPatches ? "default" : "outline"} onClick={() => setShowAllPatches((current) => !current)}>{showAllPatches ? "Showing all patches" : "Show all patches"}</Button>{selectedNodeId && <Button size="sm" variant={focusEnabled ? "default" : "outline"} onClick={onToggleFocus}><Focus className="mr-1.5 h-3.5 w-3.5" />{focusEnabled ? "Route focus on" : "Focus selected route"}</Button>}{selectedNodeId && <Button size="sm" variant="ghost" onClick={onClearFocus}><X className="mr-1.5 h-3.5 w-3.5" />Clear</Button>}</div></div>
    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-5"><label className="relative min-w-[12rem] flex-1 sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input aria-label="Search patch flow" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a patch, channel, or source" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label><select aria-label="Filter patch flow by source" value={sourceGroup} onChange={(event) => setSourceGroup(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><option value="all">All sources</option>{sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}</select><select aria-label="Filter patch flow by entity type" value={entityType} onChange={(event) => setEntityType(event.target.value as "all" | PatchEntityType)} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><option value="all">All patch types</option><option value="input">Physical inputs</option><option value="channel">Mixer channels</option><option value="bus">Mix buses</option><option value="matrix">Matrix mixes</option><option value="output">Physical outputs</option></select>{hasFilters && <Button size="sm" variant="ghost" onClick={() => { setQuery(""); setSourceGroup("all"); setEntityType("all"); }}><SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />Clear filters</Button>}</div>
    <div className="h-[620px] bg-slate-50 dark:bg-slate-950"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.12 }} minZoom={0.25} maxZoom={1.75} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}><Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#cbd5e1" /><Controls showInteractive={false} position="bottom-left" /><MiniMap position="bottom-right" nodeColor={(node) => groupTokens[(node.data as GroupNodeData).lane]?.accent || "#94a3b8"} maskColor="rgba(248, 250, 252, 0.72)" /></ReactFlow></div>
  </section>;
}

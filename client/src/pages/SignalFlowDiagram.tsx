import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { changeMindMapZoom, filterMindMapNodes, getFocusedMindMapNodeIds, getMindMapSourceOptions, type MindMapFilterNode } from "@/lib/mindMapNavigation";
import { getGroupKeyForNodeType, getNodeGroupLabel, getNodeSourceLabel, getSelectedPathRoles, type SignalFlowNode, type TraceRole } from "@/lib/signalFlowTrace";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronDown, ChevronRight, CircleDot, Focus, Hand, Headphones, Layers3, Loader2, Minus, Plus, Radio, RotateCcw, Search, Speaker, Waypoints, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

type NodeType = "input" | "channel" | "bus" | "matrix" | "output";
type MindMapBranchKey = "inputs" | "channels" | "buses" | "matrices" | "outputs";
type BranchFilter = { query: string; sourceGroup: string };
type CanvasPoint = { x: number; y: number };

export type FlowNode = SignalFlowNode & {
  id: string;
  type: NodeType;
  name: string;
  index: number;
  group?: string;
  gain?: number;
  mute?: boolean;
  solo?: boolean;
};

const nodeStyles: Record<NodeType, { chip: string; line: string; icon: string; label: string }> = {
  input: { chip: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100", line: "bg-emerald-300 dark:bg-emerald-700", icon: "bg-emerald-500", label: "Inputs" },
  channel: { chip: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100", line: "bg-blue-300 dark:bg-blue-700", icon: "bg-blue-500", label: "Channels" },
  bus: { chip: "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-100", line: "bg-violet-300 dark:bg-violet-700", icon: "bg-violet-500", label: "Buses" },
  matrix: { chip: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100", line: "bg-amber-300 dark:bg-amber-700", icon: "bg-amber-500", label: "Matrices" },
  output: { chip: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100", line: "bg-rose-300 dark:bg-rose-700", icon: "bg-rose-500", label: "Outputs" },
};

const branchStyles: Record<NodeType, { header: string; connector: string; halo: string }> = {
  input: { header: "border-emerald-400/50 bg-emerald-500/15 text-emerald-50 hover:bg-emerald-500/20", connector: "bg-emerald-400", halo: "shadow-emerald-500/15" },
  channel: { header: "border-blue-400/50 bg-blue-500/15 text-blue-50 hover:bg-blue-500/20", connector: "bg-blue-400", halo: "shadow-blue-500/15" },
  bus: { header: "border-violet-400/50 bg-violet-500/15 text-violet-50 hover:bg-violet-500/20", connector: "bg-violet-400", halo: "shadow-violet-500/15" },
  matrix: { header: "border-amber-400/50 bg-amber-500/15 text-amber-50 hover:bg-amber-500/20", connector: "bg-amber-400", halo: "shadow-amber-500/15" },
  output: { header: "border-rose-400/50 bg-rose-500/15 text-rose-50 hover:bg-rose-500/20", connector: "bg-rose-400", halo: "shadow-rose-500/15" },
};

export const mindMapBranchLayout: Array<{ key: MindMapBranchKey; type: NodeType; title: string; description: string; mobileOrder: number }> = [
  { key: "inputs", type: "input", title: "Physical Inputs", description: "Stagebox and local patches feeding the console.", mobileOrder: 2 },
  { key: "buses", type: "bus", title: "Mix Buses", description: "Aux, monitor, and subgroup destinations.", mobileOrder: 4 },
  { key: "channels", type: "channel", title: "Mixer Channels", description: "Source-assigned WING channel strips.", mobileOrder: 3 },
  { key: "matrices", type: "matrix", title: "Matrix Mixes", description: "Zone, broadcast, and matrix feeds.", mobileOrder: 5 },
  { key: "outputs", type: "output", title: "Physical Outputs", description: "Console, stagebox, and external output patches.", mobileOrder: 6 },
];

export function getNextVisibleNodeCount(currentCount: number, totalNodes: number, pageSize = 12) {
  return Math.min(totalNodes, currentCount + pageSize);
}

export function getVisibleBranchNodes<T>(nodes: T[], expanded: boolean, visibleCount: number) {
  return expanded ? nodes.slice(0, visibleCount) : [];
}

export function getMindMapBranchSide(key: MindMapBranchKey): "left" | "right" | "bottom" {
  if (key === "inputs" || key === "channels") return "left";
  if (key === "buses" || key === "matrices") return "right";
  return "bottom";
}

const defaultBranchFilters: Record<MindMapBranchKey, BranchFilter> = {
  inputs: { query: "", sourceGroup: "all" },
  channels: { query: "", sourceGroup: "all" },
  buses: { query: "", sourceGroup: "all" },
  matrices: { query: "", sourceGroup: "all" },
  outputs: { query: "", sourceGroup: "all" },
};

function nodeSummary(node: FlowNode) {
  const position = node.type === "input" || node.type === "output" ? `${node.group || "I/O"} ${node.index}` : `${nodeStyles[node.type].label.slice(0, -1)} ${node.index}`;
  return `${position} · ${node.incoming.length} in · ${node.outgoing.length} out`;
}

export default function SignalFlowDiagram() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = Number.parseInt(params.id, 10);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<CanvasPoint>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [focusSelectedRoute, setFocusSelectedRoute] = useState(false);
  const [branchFilters, setBranchFilters] = useState<Record<MindMapBranchKey, BranchFilter>>(defaultBranchFilters);
  const dragRef = useRef<{ pointerId: number; origin: CanvasPoint; start: CanvasPoint } | null>(null);

  const { data: snapshot, isLoading: isSnapshotLoading, error: snapshotError } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId },
    { enabled: isAuthenticated && Number.isFinite(snapshotId) },
  );

  useEffect(() => {
    if (!Number.isFinite(snapshotId)) setLocation("/404");
  }, [snapshotId, setLocation]);

  useEffect(() => {
    if (snapshotError) {
      toast.error(snapshotError.message);
      setLocation("/uploader");
    }
  }, [snapshotError, setLocation]);

  const nodeMap = useMemo(() => {
    const parsed = snapshot?.parsed as any;
    const nodes = new Map<string, FlowNode>();
    if (!parsed) return nodes;

    const addNode = (node: FlowNode) => nodes.set(node.id, node);
    const outputByIndex = new Map<number, string>();
    for (const input of parsed.inputs ?? []) addNode({ id: `input:${input.group}:${input.index}`, type: "input", name: input.name || `${input.group} ${input.index}`, index: input.index, group: input.group, configuredSource: `${input.group} ${input.index}`, gain: input.gain, outgoing: [], incoming: [] });
    for (const output of parsed.outputs ?? []) {
      const id = `output:${output.group}:${output.index}`;
      outputByIndex.set(output.index, id);
      addNode({ id, type: "output", name: output.name || `${output.group} ${output.index}`, index: output.index, group: output.group, configuredSource: output.source ? `${output.source.group} ${output.source.index}` : undefined, gain: output.level, outgoing: [], incoming: [] });
    }
    for (const channel of parsed.channels ?? []) addNode({ id: `channel:${channel.index}`, type: "channel", name: channel.name || `Channel ${channel.index}`, index: channel.index, group: channel.group, configuredSource: channel.inputSource ? `${channel.inputSource.group} ${channel.inputSource.index}` : undefined, gain: channel.gain, mute: channel.mute, solo: channel.solo, outgoing: [], incoming: [] });
    for (const bus of parsed.buses ?? []) addNode({ id: `bus:${bus.index}`, type: "bus", name: bus.name || `Bus ${bus.index}`, index: bus.index, group: bus.group, gain: bus.gain, mute: bus.mute, outgoing: [], incoming: [] });
    for (const matrix of parsed.matrices ?? []) addNode({ id: `matrix:${matrix.index}`, type: "matrix", name: matrix.name || `Matrix ${matrix.index}`, index: matrix.index, group: matrix.group, gain: matrix.gain, mute: matrix.mute, outgoing: [], incoming: [] });

    const targetId = (destination: string, index: number) => destination === "output" ? outputByIndex.get(index) : `${destination}:${index}`;
    const link = (from: string, to: string | undefined) => {
      if (!to || !nodes.has(from) || !nodes.has(to)) return;
      const fromNode = nodes.get(from)!;
      const toNode = nodes.get(to)!;
      if (!fromNode.outgoing.includes(to)) fromNode.outgoing.push(to);
      if (!toNode.incoming.includes(from)) toNode.incoming.push(from);
    };
    for (const channel of parsed.channels ?? []) {
      const id = `channel:${channel.index}`;
      if (channel.inputSource) link(`input:${channel.inputSource.group}:${channel.inputSource.index}`, id);
      for (const route of channel.routes ?? []) link(id, targetId(route.destination, route.index));
    }
    for (const bus of parsed.buses ?? []) for (const route of bus.routes ?? []) link(`bus:${bus.index}`, targetId(route.destination, route.index));
    for (const matrix of parsed.matrices ?? []) for (const route of matrix.routes ?? []) link(`matrix:${matrix.index}`, targetId(route.destination, route.index));
    for (const output of parsed.outputs ?? []) {
      const sourceGroup = String(output.source?.group || "").toLowerCase();
      const sourceType = sourceGroup === "mtx" ? "matrix" : sourceGroup === "ch" ? "channel" : sourceGroup;
      if (["channel", "bus", "matrix"].includes(sourceType) && output.source?.index !== undefined) link(`${sourceType}:${output.source.index}`, `output:${output.group}:${output.index}`);
    }
    return nodes;
  }, [snapshot]);

  const groups = useMemo(() => {
    const all = Array.from(nodeMap.values());
    const byType = (type: NodeType) => all.filter((node) => node.type === type);
    return { inputs: byType("input"), channels: byType("channel"), buses: byType("bus"), matrices: byType("matrix"), outputs: byType("output") };
  }, [nodeMap]);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;
  const traceRoles = useMemo(() => getSelectedPathRoles(nodeMap, selectedNodeId), [nodeMap, selectedNodeId]);
  const focusedNodeIds = useMemo(() => getFocusedMindMapNodeIds(traceRoles, selectedNodeId, focusSelectedRoute), [focusSelectedRoute, selectedNodeId, traceRoles]);
  const selectNode = (id: string) => {
    const roles = getSelectedPathRoles(nodeMap, id);
    setSelectedNodeId(id);
    setExpandedGroups((current) => {
      const next = new Set(current);
      for (const nodeId of Array.from(roles.keys())) {
        const relatedNode = nodeMap.get(nodeId);
        if (relatedNode) next.add(getGroupKeyForNodeType(relatedNode.type));
      }
      return next;
    });
  };
  const toggleGroup = (group: string) => setExpandedGroups((current) => {
    const next = new Set(current);
    next.has(group) ? next.delete(group) : next.add(group);
    return next;
  });
  const clearSelectedPath = () => {
    setSelectedNodeId(null);
    setFocusSelectedRoute(false);
  };
  const updateBranchFilter = (branch: MindMapBranchKey, patch: Partial<BranchFilter>) => setBranchFilters((current) => ({ ...current, [branch]: { ...current[branch], ...patch } }));
  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,input,select,textarea,label")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, origin: pan, start: { x: event.clientX, y: event.clientY } };
    setIsPanning(true);
  };
  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({ x: drag.origin.x + event.clientX - drag.start.x, y: drag.origin.y + event.clientY - drag.start.y });
  };
  const finishCanvasPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsPanning(false);
    }
  };

  if (loading || !isAuthenticated || !Number.isFinite(snapshotId)) return <LoadingState label="Loading signal flow…" />;
  if (isSnapshotLoading) return <LoadingState label="Building your routing mind map…" />;
  if (snapshotError || !snapshot?.parsed) return null;

  const parsed = snapshot.parsed as any;
  const mixerName = parsed.metadata?.mixerName || snapshot.filename?.replace(/\.snap$/i, "") || "WING Console";
  const branchProps = { nodeMap, selectedNodeId, traceRoles, setSelectedNodeId: selectNode };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/snapshot/${snapshotId}`)} aria-label="Back to snapshot"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Interactive routing explorer</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Signal Flow Mind Map</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Explore every routing domain from the WING console hub, then follow focused paths through sources, mixes, and outputs.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">{groups.inputs.length} inputs</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">{groups.channels.length} channels</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">{groups.buses.length + groups.matrices.length} mix destinations</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">{groups.outputs.length} outputs</span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><span className="font-semibold text-slate-900 dark:text-white">Path tracing</span><span>Open a branch, then select a node to reveal its full upstream and downstream route.</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Upstream source</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Selected node</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Downstream destination</span></div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedNode && <Button variant={focusSelectedRoute ? "default" : "outline"} size="sm" onClick={() => setFocusSelectedRoute((current) => !current)} aria-pressed={focusSelectedRoute}><Focus className="mr-1.5 h-3.5 w-3.5" />{focusSelectedRoute ? "Route focus on" : "Focus selected route"}</Button>}
            {selectedNode && <Button variant="ghost" size="sm" onClick={clearSelectedPath}>Clear focused path</Button>}
          </div>
        </div>

        <Card className="overflow-hidden border-slate-800 bg-slate-950 p-0 shadow-2xl shadow-slate-950/20">
          <div className={`relative isolate overflow-hidden px-4 py-6 sm:px-6 sm:py-8 ${isPanning ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={handleCanvasPointerDown} onPointerMove={handleCanvasPointerMove} onPointerUp={finishCanvasPan} onPointerCancel={finishCanvasPan} onWheel={(event) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); setZoom((current) => changeMindMapZoom(current, event.deltaY < 0 ? "in" : "out")); } }} style={{ touchAction: "none" }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.22)_1px,transparent_0)] [background-size:24px_24px]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/75 p-2 text-xs text-slate-200 shadow-lg backdrop-blur">
              <div className="flex items-center gap-1"><span className="hidden px-2 text-slate-400 sm:inline">Canvas</span><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-100 hover:bg-white/10 hover:text-white" onClick={() => setZoom((current) => changeMindMapZoom(current, "out"))} aria-label="Zoom out"><Minus className="h-4 w-4" /></Button><span className="min-w-12 text-center font-semibold">{Math.round(zoom * 100)}%</span><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-100 hover:bg-white/10 hover:text-white" onClick={() => setZoom((current) => changeMindMapZoom(current, "in"))} aria-label="Zoom in"><Plus className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="h-8 text-slate-100 hover:bg-white/10 hover:text-white" onClick={resetViewport}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset</Button></div>
              <span className="flex items-center gap-1.5 px-2 text-slate-400"><Hand className="h-3.5 w-3.5" />Drag background to pan <span className="hidden sm:inline">· Ctrl/Cmd + scroll to zoom</span></span>
            </div>
            <div className="relative grid gap-5 transition-transform duration-200 lg:grid-cols-[minmax(0,1fr)_15rem_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto] lg:items-center lg:gap-x-8 lg:gap-y-10" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center center" }}>
              <MindMapBranch className="order-2 lg:col-start-1 lg:row-start-1" branchKey="inputs" nodes={groups.inputs} expanded={expandedGroups.has("inputs")} onToggle={toggleGroup} filter={branchFilters.inputs} onFilterChange={(patch) => updateBranchFilter("inputs", patch)} focusedNodeIds={focusedNodeIds} {...branchProps} />
              <MindMapBranch className="order-4 lg:col-start-3 lg:row-start-1" branchKey="buses" nodes={groups.buses} expanded={expandedGroups.has("buses")} onToggle={toggleGroup} filter={branchFilters.buses} onFilterChange={(patch) => updateBranchFilter("buses", patch)} focusedNodeIds={focusedNodeIds} {...branchProps} />
              <ConsoleHub className="order-1 lg:col-start-2 lg:row-span-2 lg:row-start-1" mixerName={mixerName} />
              <MindMapBranch className="order-3 lg:col-start-1 lg:row-start-2" branchKey="channels" nodes={groups.channels} expanded={expandedGroups.has("channels")} onToggle={toggleGroup} filter={branchFilters.channels} onFilterChange={(patch) => updateBranchFilter("channels", patch)} focusedNodeIds={focusedNodeIds} {...branchProps} />
              <MindMapBranch className="order-5 lg:col-start-3 lg:row-start-2" branchKey="matrices" nodes={groups.matrices} expanded={expandedGroups.has("matrices")} onToggle={toggleGroup} filter={branchFilters.matrices} onFilterChange={(patch) => updateBranchFilter("matrices", patch)} focusedNodeIds={focusedNodeIds} {...branchProps} />
              <MindMapBranch className="order-6 lg:col-span-3 lg:row-start-3 lg:mx-auto lg:w-full lg:max-w-3xl" branchKey="outputs" nodes={groups.outputs} expanded={expandedGroups.has("outputs")} onToggle={toggleGroup} filter={branchFilters.outputs} onFilterChange={(patch) => updateBranchFilter("outputs", patch)} focusedNodeIds={focusedNodeIds} {...branchProps} />
            </div>
          </div>
          <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-4 text-xs text-slate-300">This mind map groups the routing domains around your console, while the Route Inspector retains the exact live patch data and selected-path relationships.</div>
        </Card>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mind-map workflow</p><h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Start from the console, open a routing branch, and follow any selected path.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">The branch cards show the current source context for every patch. Selecting any input, channel, bus, matrix, or output automatically opens related branches so you can inspect its complete route.</p></div>
          <RouteInspector node={selectedNode} nodeMap={nodeMap} traceRoles={traceRoles} onClose={() => setSelectedNodeId(null)} />
        </div>
      </main>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /><span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span></div>;
}

function ConsoleHub({ mixerName, className }: { mixerName: string; className?: string }) {
  return <section className={`relative flex flex-col items-center text-center ${className || ""}`} data-testid="mind-map-hub">
    <div className="absolute h-44 w-44 rounded-full border border-indigo-400/25 bg-indigo-500/10 shadow-[0_0_70px_rgba(99,102,241,0.35)]" />
    <div className="relative flex min-h-44 w-full max-w-[15rem] flex-col items-center justify-center rounded-[2rem] border border-indigo-300/40 bg-slate-900/90 px-5 py-6 text-white shadow-2xl shadow-indigo-500/20 backdrop-blur">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 text-white shadow-lg shadow-indigo-500/30"><Waypoints className="h-7 w-7" /></div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">WING Console</p>
      <h2 className="mt-1 break-words text-lg font-bold">{mixerName}</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">Central routing hub</p>
    </div>
  </section>;
}

export function MindMapBranch({ branchKey, nodes, expanded, onToggle, nodeMap, selectedNodeId, traceRoles, setSelectedNodeId, filter, onFilterChange, focusedNodeIds, className }: { branchKey: MindMapBranchKey; nodes: FlowNode[]; expanded: boolean; onToggle: (key: string) => void; nodeMap: Map<string, FlowNode>; selectedNodeId: string | null; traceRoles: Map<string, TraceRole>; setSelectedNodeId: (id: string) => void; filter: BranchFilter; onFilterChange: (patch: Partial<BranchFilter>) => void; focusedNodeIds: Set<string> | null; className?: string }) {
  const branch = mindMapBranchLayout.find((candidate) => candidate.key === branchKey)!;
  const [visibleCount, setVisibleCount] = useState(12);
  const style = branchStyles[branch.type];
  const focusNodes = focusedNodeIds ? nodes.filter((node) => focusedNodeIds.has(node.id)) : nodes;
  const filteredNodes = filterMindMapNodes(focusNodes as MindMapFilterNode[], filter.query, filter.sourceGroup) as FlowNode[];
  const sourceOptions = getMindMapSourceOptions(focusNodes as MindMapFilterNode[]);
  const visibleNodes = getVisibleBranchNodes(filteredNodes, expanded, visibleCount);
  const remainingNodes = Math.max(0, filteredNodes.length - visibleNodes.length);
  const side = getMindMapBranchSide(branchKey);
  const hasActiveFilter = Boolean(filter.query || filter.sourceGroup !== "all");
  const noFocusedNodes = Boolean(focusedNodeIds && focusNodes.length === 0);

  return (
    <section className={`relative transition-opacity ${focusedNodeIds && focusNodes.length === 0 ? "opacity-35" : ""} ${className || ""}`} data-testid={`mind-map-branch-${branchKey}`}>
      <div aria-hidden="true" className={`absolute top-1/2 hidden h-px bg-gradient-to-r from-transparent ${style.connector} to-transparent opacity-70 lg:block ${side === "left" ? "-right-8 w-8" : side === "right" ? "-left-8 w-8" : "left-1/2 top-0 h-8 w-px -translate-x-1/2 -translate-y-8 bg-gradient-to-b"}`} />
      <button type="button" aria-expanded={expanded} onClick={() => onToggle(branchKey)} className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-xl transition duration-200 hover:-translate-y-0.5 ${style.header} ${style.halo}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${nodeStyles[branch.type].icon} text-white shadow-sm`}>{branch.type === "input" ? <Radio className="h-4 w-4" /> : branch.type === "channel" ? <CircleDot className="h-4 w-4" /> : branch.type === "output" ? <Speaker className="h-4 w-4" /> : <Layers3 className="h-4 w-4" />}</span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{branch.title}</span><span className="mt-0.5 block text-xs text-white/70">{branch.description}</span></span>
        <span className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-1 text-xs font-bold">{filteredNodes.length}/{nodes.length}{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
      </button>
      {expanded && <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/80 p-3 shadow-xl shadow-black/15 backdrop-blur">
        <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input aria-label={`Search ${branch.title}`} value={filter.query} onChange={(event) => onFilterChange({ query: event.target.value })} placeholder={`Search ${branch.title.toLowerCase()}`} className="h-9 w-full rounded-lg border border-white/15 bg-slate-950/80 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none" /></label>
          <select aria-label={`Filter ${branch.title} by source`} value={filter.sourceGroup} onChange={(event) => onFilterChange({ sourceGroup: event.target.value })} className="h-9 rounded-lg border border-white/15 bg-slate-950 px-2 text-xs text-white focus:border-indigo-400 focus:outline-none"><option value="all">All sources</option>{sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}</select>
          {hasActiveFilter && <button type="button" onClick={() => onFilterChange({ query: "", sourceGroup: "all" })} className="h-9 rounded-lg px-2 text-xs font-semibold text-indigo-200 transition hover:bg-white/10">Clear</button>}
        </div>
        {visibleNodes.length > 0 ? <div className="grid gap-2 sm:grid-cols-2">{visibleNodes.map((node) => <OrgChartNode key={node.id} node={node} nodeMap={nodeMap} selected={selectedNodeId === node.id} pathRole={traceRoles.get(node.id)} hasActiveTrace={traceRoles.size > 0} onSelect={setSelectedNodeId} mindMap />)}</div> : <div className="rounded-xl border border-dashed border-white/15 px-4 py-5 text-center text-xs text-slate-300">{noFocusedNodes ? "No nodes in this branch belong to the focused route." : "No nodes match this branch search and source filter."}</div>}
        {remainingNodes > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold"><button type="button" onClick={() => setVisibleCount((count) => getNextVisibleNodeCount(count, filteredNodes.length))} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white transition hover:bg-white/20">Show {Math.min(12, remainingNodes)} more</button><button type="button" onClick={() => setVisibleCount(filteredNodes.length)} className="rounded-full px-3 py-1.5 text-indigo-200 transition hover:bg-white/10">Show all {remainingNodes}</button><span className="text-slate-400">{visibleNodes.length} of {filteredNodes.length}</span></div>}
      </div>}
    </section>
  );
}

export function OrgChartNode({ node, nodeMap, selected, pathRole, hasActiveTrace, onSelect, mindMap = false }: { node: FlowNode; nodeMap: Map<string, FlowNode>; selected: boolean; pathRole?: TraceRole; hasActiveTrace: boolean; onSelect: (id: string) => void; mindMap?: boolean }) {
  const style = nodeStyles[node.type];
  const connectionCount = node.incoming.length + node.outgoing.length;
  const traceStyle = pathRole === "selected" ? "ring-2 ring-indigo-500 ring-offset-2 shadow-lg shadow-indigo-500/20 dark:ring-offset-slate-950" : pathRole === "upstream" ? "border-emerald-400 bg-emerald-100/80 shadow-md shadow-emerald-500/10 dark:border-emerald-500 dark:bg-emerald-950/80" : pathRole === "downstream" ? "border-sky-400 bg-sky-100/80 shadow-md shadow-sky-500/10 dark:border-sky-500 dark:bg-sky-950/80" : hasActiveTrace ? "opacity-40" : "hover:-translate-y-0.5 hover:shadow-md";
  return <button onClick={() => onSelect(node.id)} title={`${node.name}: ${nodeSummary(node)}`} className={`relative rounded-xl border p-3 text-left shadow-sm transition ${style.chip} ${traceStyle}`}><>{!mindMap && <span className={`absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 -translate-y-2 ${style.line}`} />}</><div className="flex items-start gap-2"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.icon}`} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{node.name}</span><span className="mt-0.5 block truncate text-[11px] opacity-70">{nodeSummary(node)}</span><span className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold"><span className="max-w-full truncate rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">Group · {getNodeGroupLabel(node)}</span><span className="max-w-full truncate rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{getNodeSourceLabel(node, nodeMap)}</span></span></span>{connectionCount > 0 && <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-bold dark:bg-white/10">{connectionCount}</span>}</div></button>;
}

function RouteInspector({ node, nodeMap, traceRoles, onClose }: { node: FlowNode | null; nodeMap: Map<string, FlowNode>; traceRoles: Map<string, TraceRole>; onClose: () => void }) {
  if (!node) return <Card className="flex min-h-[240px] flex-col items-center justify-center border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><Headphones className="h-10 w-10 text-indigo-400" /><h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Route Inspector</h2><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Open a branch and select a node in the mind map to see its live inbound and outbound routing connections.</p></Card>;
  const style = nodeStyles[node.type];
  const routes = (ids: string[]) => ids.map((id) => nodeMap.get(id)).filter(Boolean) as FlowNode[];
  return <Card className="h-fit border-slate-200 p-5 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className={`mt-1 h-3 w-3 rounded-full ${style.icon}`} /><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{style.label.slice(0, -1)}</p><h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{node.name}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{nodeSummary(node)}</p></div></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close route inspector"><X className="h-4 w-4" /></Button></div><div className="mt-5 grid grid-cols-2 gap-3 text-xs"><InfoTile label="Group" value={getNodeGroupLabel(node)} /><InfoTile label="Source" value={getNodeSourceLabel(node, nodeMap)} /><InfoTile label="Gain / level" value={node.gain === undefined ? "—" : `${node.gain.toFixed(1)} dB`} /><InfoTile label="Status" value={node.mute ? "Muted" : node.solo ? "Solo" : "Active"} alert={Boolean(node.mute)} /></div><div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100"><span className="font-semibold">Focused path:</span> {Array.from(traceRoles.values()).filter((role) => role === "upstream").length} upstream and {Array.from(traceRoles.values()).filter((role) => role === "downstream").length} downstream nodes highlighted in the map.</div><RouteList title="Upstream connections" empty="No upstream route found" nodes={routes(node.incoming)} /><RouteList title="Downstream connections" empty="No downstream route found" nodes={routes(node.outgoing)} /></Card>;
}

function InfoTile({ label, value, alert }: { label: string; value: string; alert?: boolean }) { return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><p className="text-slate-500">{label}</p><p className={`mt-1 font-semibold ${alert ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{value}</p></div>; }
function RouteList({ title, empty, nodes }: { title: string; empty: string; nodes: FlowNode[] }) { return <div className="mt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{title}</h3>{nodes.length === 0 ? <p className="mt-2 text-sm text-slate-500">{empty}</p> : <div className="mt-2 space-y-2">{nodes.map((route) => <div key={route.id} className={`rounded-lg border px-3 py-2 text-sm ${nodeStyles[route.type].chip}`}><p className="font-semibold">{route.name}</p><p className="mt-0.5 text-xs opacity-70">{nodeSummary(route)}</p></div>)}</div>}</div>; }

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGroupKeyForNodeType, getNodeGroupLabel, getNodeSourceLabel, getSelectedPathRoles, type SignalFlowNode, type TraceRole } from "@/lib/signalFlowTrace";
import { trpc } from "@/lib/trpc";
import {
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Headphones,
  Layers3,
  Loader2,
  Radio,
  Speaker,
  Waypoints,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

type NodeType = "input" | "channel" | "bus" | "matrix" | "output";

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
  input: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100",
    line: "bg-emerald-300 dark:bg-emerald-700",
    icon: "bg-emerald-500",
    label: "Inputs",
  },
  channel: {
    chip: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100",
    line: "bg-blue-300 dark:bg-blue-700",
    icon: "bg-blue-500",
    label: "Channels",
  },
  bus: {
    chip: "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-100",
    line: "bg-violet-300 dark:bg-violet-700",
    icon: "bg-violet-500",
    label: "Buses",
  },
  matrix: {
    chip: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100",
    line: "bg-amber-300 dark:bg-amber-700",
    icon: "bg-amber-500",
    label: "Matrices",
  },
  output: {
    chip: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100",
    line: "bg-rose-300 dark:bg-rose-700",
    icon: "bg-rose-500",
    label: "Outputs",
  },
};

export function getNextVisibleNodeCount(currentCount: number, totalNodes: number, pageSize = 12) {
  return Math.min(totalNodes, currentCount + pageSize);
}

export function getVisibleBranchNodes<T>(nodes: T[], expanded: boolean, visibleCount: number) {
  return expanded ? nodes.slice(0, visibleCount) : [];
}

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

    for (const input of parsed.inputs ?? []) {
      addNode({
        id: `input:${input.group}:${input.index}`,
        type: "input",
        name: input.name || `${input.group} ${input.index}`,
        index: input.index,
        group: input.group,
        gain: input.gain,
        outgoing: [],
        incoming: [],
      });
    }

    for (const output of parsed.outputs ?? []) {
      const id = `output:${output.group}:${output.index}`;
      outputByIndex.set(output.index, id);
      addNode({
        id,
        type: "output",
        name: output.name || `${output.group} ${output.index}`,
        index: output.index,
        group: output.group,
        gain: output.level,
        outgoing: [],
        incoming: [],
      });
    }

    for (const channel of parsed.channels ?? []) {
      addNode({
        id: `channel:${channel.index}`,
        type: "channel",
        name: channel.name || `Channel ${channel.index}`,
        index: channel.index,
        group: channel.group,
        gain: channel.gain,
        mute: channel.mute,
        solo: channel.solo,
        outgoing: [],
        incoming: [],
      });
    }

    for (const bus of parsed.buses ?? []) {
      addNode({
        id: `bus:${bus.index}`,
        type: "bus",
        name: bus.name || `Bus ${bus.index}`,
        index: bus.index,
        group: bus.group,
        gain: bus.gain,
        mute: bus.mute,
        outgoing: [],
        incoming: [],
      });
    }

    for (const matrix of parsed.matrices ?? []) {
      addNode({
        id: `matrix:${matrix.index}`,
        type: "matrix",
        name: matrix.name || `Matrix ${matrix.index}`,
        index: matrix.index,
        group: matrix.group,
        gain: matrix.gain,
        mute: matrix.mute,
        outgoing: [],
        incoming: [],
      });
    }

    const targetId = (destination: string, index: number) => {
      if (destination === "output") return outputByIndex.get(index);
      return `${destination}:${index}`;
    };

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
    for (const bus of parsed.buses ?? []) {
      for (const route of bus.routes ?? []) link(`bus:${bus.index}`, targetId(route.destination, route.index));
    }
    for (const matrix of parsed.matrices ?? []) {
      for (const route of matrix.routes ?? []) link(`matrix:${matrix.index}`, targetId(route.destination, route.index));
    }
    return nodes;
  }, [snapshot]);

  const groups = useMemo(() => {
    const all = Array.from(nodeMap.values());
    const byType = (type: NodeType) => all.filter((node) => node.type === type);
    return {
      inputs: byType("input"),
      channels: byType("channel"),
      buses: byType("bus"),
      matrices: byType("matrix"),
      outputs: byType("output"),
    };
  }, [nodeMap]);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;
  const traceRoles = useMemo(() => getSelectedPathRoles(nodeMap, selectedNodeId), [nodeMap, selectedNodeId]);
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
  const toggleGroup = (group: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  if (loading || !isAuthenticated || !Number.isFinite(snapshotId)) return <LoadingState label="Loading signal flow…" />;
  if (isSnapshotLoading) return <LoadingState label="Building your routing organization chart…" />;
  if (snapshotError || !snapshot?.parsed) return null;

  const parsed = snapshot.parsed as any;
  const mixerName = parsed.metadata?.mixerName || snapshot.filename?.replace(/\.snap$/i, "") || "WING Console";
  const groupProps = { nodeMap, selectedNodeId, traceRoles, setSelectedNodeId: selectNode };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/snapshot/${snapshotId}`)} aria-label="Back to snapshot"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Interactive routing explorer</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Signal Flow Organization Chart</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Follow routing top-down from the WING console through sources, channels, mixes, and outputs.</p>
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><span className="font-semibold text-slate-900 dark:text-white">Path tracing</span><span>Click a node to reveal its full upstream and downstream route.</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Upstream source</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Selected node</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Downstream destination</span></div>
          {selectedNode && <Button variant="ghost" size="sm" onClick={() => setSelectedNodeId(null)}>Clear focused path</Button>}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(180deg,rgba(99,102,241,0.09),transparent_45rem)] p-0 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(99,102,241,0.15),transparent_45rem)]">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
              <div className="mx-auto flex max-w-sm flex-col items-center rounded-[2rem] border border-indigo-200 bg-white px-6 py-7 text-center shadow-xl shadow-indigo-500/10 dark:border-indigo-800 dark:bg-slate-900 dark:shadow-indigo-950/40">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/35"><Waypoints className="h-8 w-8" /></div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Console hub</p>
                <h2 className="mt-1 break-words text-xl font-bold text-slate-950 dark:text-white">{mixerName}</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Open a stage to reveal its nodes, then select any node for exact upstream and downstream routes.</p>
              </div>

              <ChartConnector />
              <OrgChartGroup title="Stage 1 · Physical Input Sources" description="Stagebox and local console inputs feeding the WING channel strips." icon={<Radio className="h-4 w-4" />} groupKey="inputs" nodes={groups.inputs} defaultType="input" expanded={expandedGroups.has("inputs")} onToggle={toggleGroup} {...groupProps} />

              <ChartConnector />
              <OrgChartGroup title="Stage 2 · Mixer Channels" description="Channel strips whose sources and sends form the core of the mix." icon={<CircleDot className="h-4 w-4" />} groupKey="channels" nodes={groups.channels} defaultType="channel" expanded={expandedGroups.has("channels")} onToggle={toggleGroup} {...groupProps} />

              <ChartConnector />
              <div className="relative grid gap-5 md:grid-cols-2">
                <div className="pointer-events-none absolute left-1/2 top-0 hidden h-px w-1/2 -translate-x-full bg-violet-300 dark:bg-violet-700 md:block" />
                <div className="pointer-events-none absolute right-1/2 top-0 hidden h-px w-1/2 translate-x-full bg-amber-300 dark:bg-amber-700 md:block" />
                <OrgChartGroup title="Stage 3A · Mix Buses" description="Aux, monitor, and subgroup destinations supplied by channels." icon={<Layers3 className="h-4 w-4" />} groupKey="buses" nodes={groups.buses} defaultType="bus" expanded={expandedGroups.has("buses")} onToggle={toggleGroup} {...groupProps} />
                <OrgChartGroup title="Stage 3B · Matrix Mixes" description="Matrix destinations and broadcast or zone feeds." icon={<Layers3 className="h-4 w-4" />} groupKey="matrices" nodes={groups.matrices} defaultType="matrix" expanded={expandedGroups.has("matrices")} onToggle={toggleGroup} {...groupProps} />
              </div>

              <ChartConnector />
              <OrgChartGroup title="Stage 4 · Physical Outputs" description="Console, stagebox, and external outputs carrying the completed signal path." icon={<Speaker className="h-4 w-4" />} groupKey="outputs" nodes={groups.outputs} defaultType="output" expanded={expandedGroups.has("outputs")} onToggle={toggleGroup} {...groupProps} />
            </div>
            <div className="border-t border-slate-200 bg-white/70 px-6 py-4 text-xs text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">The organization chart presents the complete routing hierarchy. It groups the live relationships detected in the uploaded `.snap` file; the Route Inspector reveals each node’s exact patch path.</div>
          </Card>

          <RouteInspector node={selectedNode} nodeMap={nodeMap} traceRoles={traceRoles} onClose={() => setSelectedNodeId(null)} />
        </div>
      </main>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /><span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span></div>;
}

function ChartConnector() {
  return <div className="flex h-12 flex-col items-center justify-center"><span className="h-7 w-px bg-gradient-to-b from-indigo-300 to-indigo-500 dark:from-indigo-700 dark:to-indigo-500" /><ArrowDown className="h-4 w-4 text-indigo-500" /></div>;
}

function OrgChartGroup({
  title,
  description,
  icon,
  groupKey,
  nodes,
  defaultType,
  expanded,
  onToggle,
  nodeMap,
  selectedNodeId,
  traceRoles,
  setSelectedNodeId,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  groupKey: string;
  nodes: FlowNode[];
  defaultType: NodeType;
  expanded: boolean;
  onToggle: (key: string) => void;
  nodeMap: Map<string, FlowNode>;
  selectedNodeId: string | null;
  traceRoles: Map<string, TraceRole>;
  setSelectedNodeId: (id: string) => void;
}) {
  const branchPageSize = 12;
  const [visibleCount, setVisibleCount] = useState(branchPageSize);
  const style = nodeStyles[defaultType];
  const visibleNodes = getVisibleBranchNodes(nodes, expanded, visibleCount);
  const remainingNodes = Math.max(0, nodes.length - visibleNodes.length);

  return (
    <section className="relative">
      <button onClick={() => onToggle(groupKey)} className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.chip}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${style.icon}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold sm:text-base">{title}</span>
          <span className="mt-0.5 block text-xs opacity-70">{description}</span>
        </span>
        <span className="flex items-center gap-2 rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold dark:bg-white/10">{nodes.length} {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
      </button>

      {expanded && (
        <div className="relative mx-3 border-x border-b border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:mx-6">
          <div className="absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-indigo-400 dark:bg-indigo-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleNodes.map((node) => <OrgChartNode key={node.id} node={node} nodeMap={nodeMap} selected={selectedNodeId === node.id} pathRole={traceRoles.get(node.id)} hasActiveTrace={traceRoles.size > 0} onSelect={setSelectedNodeId} />)}
          </div>
          {remainingNodes > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
              <button onClick={() => setVisibleCount((count) => getNextVisibleNodeCount(count, nodes.length, branchPageSize))} className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950">Show {Math.min(branchPageSize, remainingNodes)} more</button>
              <button onClick={() => setVisibleCount(nodes.length)} className="rounded-full px-3 py-1.5 text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950">Show all {remainingNodes}</button>
              <span className="text-slate-400 dark:text-slate-500">{visibleNodes.length} of {nodes.length}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function OrgChartNode({ node, nodeMap, selected, pathRole, hasActiveTrace, onSelect }: { node: FlowNode; nodeMap: Map<string, FlowNode>; selected: boolean; pathRole?: TraceRole; hasActiveTrace: boolean; onSelect: (id: string) => void }) {
  const style = nodeStyles[node.type];
  const connectionCount = node.incoming.length + node.outgoing.length;
  const traceStyle = pathRole === "selected"
    ? "ring-2 ring-indigo-500 ring-offset-2 shadow-lg shadow-indigo-500/20 dark:ring-offset-slate-950"
    : pathRole === "upstream"
      ? "border-emerald-400 bg-emerald-100/80 shadow-md shadow-emerald-500/10 dark:border-emerald-500 dark:bg-emerald-950/80"
      : pathRole === "downstream"
        ? "border-sky-400 bg-sky-100/80 shadow-md shadow-sky-500/10 dark:border-sky-500 dark:bg-sky-950/80"
        : hasActiveTrace
          ? "opacity-40"
          : "hover:-translate-y-0.5 hover:shadow-md";
  return (
    <button onClick={() => onSelect(node.id)} title={`${node.name}: ${nodeSummary(node)}`} className={`relative rounded-xl border p-3 text-left shadow-sm transition ${style.chip} ${traceStyle}`}>
      <span className={`absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 -translate-y-2 ${style.line}`} />
      <div className="flex items-start gap-2">
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.icon}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{node.name}</span>
          <span className="mt-0.5 block truncate text-[11px] opacity-70">{nodeSummary(node)}</span>
          <span className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold"><span className="max-w-full truncate rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">Group · {getNodeGroupLabel(node)}</span><span className="max-w-full truncate rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{getNodeSourceLabel(node, nodeMap)}</span></span>
        </span>
        {connectionCount > 0 && <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-bold dark:bg-white/10">{connectionCount}</span>}
      </div>
    </button>
  );
}

function RouteInspector({ node, nodeMap, traceRoles, onClose }: { node: FlowNode | null; nodeMap: Map<string, FlowNode>; traceRoles: Map<string, TraceRole>; onClose: () => void }) {
  if (!node) {
    return <Card className="flex min-h-[320px] flex-col items-center justify-center border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><Headphones className="h-10 w-10 text-indigo-400" /><h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Route Inspector</h2><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Select a node in the organization chart to see its live inbound and outbound routing connections.</p></Card>;
  }
  const style = nodeStyles[node.type];
  const routes = (ids: string[]) => ids.map((id) => nodeMap.get(id)).filter(Boolean) as FlowNode[];
  return (
    <Card className="h-fit border-slate-200 p-5 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className={`mt-1 h-3 w-3 rounded-full ${style.icon}`} /><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{style.label.slice(0, -1)}</p><h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{node.name}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{nodeSummary(node)}</p></div></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close route inspector"><X className="h-4 w-4" /></Button></div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs"><InfoTile label="Group" value={getNodeGroupLabel(node)} /><InfoTile label="Source" value={getNodeSourceLabel(node, nodeMap)} /><InfoTile label="Gain / level" value={node.gain === undefined ? "—" : `${node.gain.toFixed(1)} dB`} /><InfoTile label="Status" value={node.mute ? "Muted" : node.solo ? "Solo" : "Active"} alert={Boolean(node.mute)} /></div>
      <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100"><span className="font-semibold">Focused path:</span> {Array.from(traceRoles.values()).filter((role) => role === "upstream").length} upstream and {Array.from(traceRoles.values()).filter((role) => role === "downstream").length} downstream nodes highlighted in the chart.</div>
      <RouteList title="Upstream connections" empty="No upstream route found" nodes={routes(node.incoming)} />
      <RouteList title="Downstream connections" empty="No downstream route found" nodes={routes(node.outgoing)} />
    </Card>
  );
}

function InfoTile({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><p className="text-slate-500">{label}</p><p className={`mt-1 font-semibold ${alert ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{value}</p></div>;
}

function RouteList({ title, empty, nodes }: { title: string; empty: string; nodes: FlowNode[] }) {
  return <div className="mt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{title}</h3>{nodes.length === 0 ? <p className="mt-2 text-sm text-slate-500">{empty}</p> : <div className="mt-2 space-y-2">{nodes.map((route) => <div key={route.id} className={`rounded-lg border px-3 py-2 text-sm ${nodeStyles[route.type].chip}`}><p className="font-semibold">{route.name}</p><p className="mt-0.5 text-xs opacity-70">{nodeSummary(route)}</p></div>)}</div>}</div>;
}

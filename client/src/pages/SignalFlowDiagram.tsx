import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFocusedSignalFlowNodeIds, getNodeGroupLabel, getNodeSourceLabel, getSelectedPathRoles, type SignalFlowNode, type TraceRole } from "@/lib/signalFlowTrace";
import { trpc } from "@/lib/trpc";
import PatchFlowCanvas from "@/pages/PatchFlowCanvas";
import { ArrowLeft, Headphones, Loader2, X } from "lucide-react";
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

const nodeStyles: Record<NodeType, { chip: string; icon: string; label: string }> = {
  input: { chip: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100", icon: "bg-emerald-500", label: "Inputs" },
  channel: { chip: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100", icon: "bg-blue-500", label: "Channels" },
  bus: { chip: "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-100", icon: "bg-violet-500", label: "Buses" },
  matrix: { chip: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100", icon: "bg-amber-500", label: "Matrices" },
  output: { chip: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100", icon: "bg-rose-500", label: "Outputs" },
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusSelectedRoute, setFocusSelectedRoute] = useState(false);

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
  const focusedNodeIds = useMemo(() => getFocusedSignalFlowNodeIds(traceRoles, selectedNodeId, focusSelectedRoute), [focusSelectedRoute, selectedNodeId, traceRoles]);
  const clearSelectedPath = () => {
    setSelectedNodeId(null);
    setFocusSelectedRoute(false);
  };

  if (loading || !isAuthenticated || !Number.isFinite(snapshotId)) return <LoadingState label="Loading signal flow…" />;
  if (isSnapshotLoading) return <LoadingState label="Building your routing canvas…" />;
  if (snapshotError || !snapshot?.parsed) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/snapshot/${snapshotId}`)} aria-label="Back to snapshot"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Interactive routing explorer</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Signal Flow Patch Canvas</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Trace physical patches through channel strips, mixes, and outputs on a zoomable cable-routing canvas.</p>
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

        <div className="mb-6 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><span className="font-semibold text-slate-900 dark:text-white">Path tracing</span><span>Select any patch to reveal its complete upstream and downstream route.</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Upstream source</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Selected node</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Downstream destination</span></div>
        </div>

        <PatchFlowCanvas entities={Array.from(nodeMap.values())} selectedNodeId={selectedNodeId} traceRoles={traceRoles} focusedNodeIds={focusedNodeIds} focusEnabled={focusSelectedRoute} onSelectNode={setSelectedNodeId} onToggleFocus={() => setFocusSelectedRoute((current) => !current)} onClearFocus={clearSelectedPath} />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Patch-flow workflow</p><h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Follow physical patches through channels, mixes, and outputs.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">Select any patch chip to trace its upstream and downstream cable path. Use the canvas controls to zoom, pan, fit the canvas, and orient yourself in the minimap.</p></div>
          <RouteInspector node={selectedNode} nodeMap={nodeMap} traceRoles={traceRoles} onClose={() => setSelectedNodeId(null)} />
        </div>
      </main>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /><span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span></div>;
}

function RouteInspector({ node, nodeMap, traceRoles, onClose }: { node: FlowNode | null; nodeMap: Map<string, FlowNode>; traceRoles: Map<string, TraceRole>; onClose: () => void }) {
  if (!node) return <Card className="flex min-h-[240px] flex-col items-center justify-center border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><Headphones className="h-10 w-10 text-indigo-400" /><h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Route Inspector</h2><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Select a patch point in the canvas to see its live inbound and outbound routing connections.</p></Card>;
  const style = nodeStyles[node.type];
  const routes = (ids: string[]) => ids.map((id) => nodeMap.get(id)).filter(Boolean) as FlowNode[];
  return <Card className="h-fit border-slate-200 p-5 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className={`mt-1 h-3 w-3 rounded-full ${style.icon}`} /><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{style.label.slice(0, -1)}</p><h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{node.name}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{nodeSummary(node)}</p></div></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close route inspector"><X className="h-4 w-4" /></Button></div><div className="mt-5 grid grid-cols-2 gap-3 text-xs"><InfoTile label="Group" value={getNodeGroupLabel(node)} /><InfoTile label="Source" value={getNodeSourceLabel(node, nodeMap)} /><InfoTile label="Gain / level" value={node.gain === undefined ? "—" : `${node.gain.toFixed(1)} dB`} /><InfoTile label="Status" value={node.mute ? "Muted" : node.solo ? "Solo" : "Active"} alert={Boolean(node.mute)} /></div><div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100"><span className="font-semibold">Focused path:</span> {Array.from(traceRoles.values()).filter((role) => role === "upstream").length} upstream and {Array.from(traceRoles.values()).filter((role) => role === "downstream").length} downstream nodes highlighted in the canvas.</div><RouteList title="Upstream connections" empty="No upstream route found" nodes={routes(node.incoming)} /><RouteList title="Downstream connections" empty="No downstream route found" nodes={routes(node.outgoing)} /></Card>;
}

function InfoTile({ label, value, alert }: { label: string; value: string; alert?: boolean }) { return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><p className="text-slate-500">{label}</p><p className={`mt-1 font-semibold ${alert ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{value}</p></div>; }
function RouteList({ title, empty, nodes }: { title: string; empty: string; nodes: FlowNode[] }) { return <div className="mt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{title}</h3>{nodes.length === 0 ? <p className="mt-2 text-sm text-slate-500">{empty}</p> : <div className="mt-2 space-y-2">{nodes.map((route) => <div key={route.id} className={`rounded-lg border px-3 py-2 text-sm ${nodeStyles[route.type].chip}`}><p className="font-semibold">{route.name}</p><p className="mt-0.5 text-xs opacity-70">{nodeSummary(route)}</p></div>)}</div>}</div>; }

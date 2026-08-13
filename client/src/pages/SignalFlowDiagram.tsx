import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

type NodeType = "input" | "channel" | "bus" | "matrix" | "output";

type FlowNode = {
  id: string;
  type: NodeType;
  name: string;
  index: number;
  group?: string;
  gain?: number;
  mute?: boolean;
  solo?: boolean;
  outgoing: string[];
  incoming: string[];
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

function nodeSummary(node: FlowNode) {
  const position = node.type === "input" || node.type === "output" ? `${node.group || "I/O"} ${node.index}` : `${nodeStyles[node.type].label.slice(0, -1)} ${node.index}`;
  return `${position} · ${node.incoming.length} in · ${node.outgoing.length} out`;
}

export default function SignalFlowDiagram() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = Number.parseInt(params.id, 10);
  // Large WING snapshots can contain hundreds of physical I/O points. Start
  // collapsed so the mixer hub and high-level branches remain readable.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const mindMapScrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const scroller = mindMapScrollRef.current;
    if (!scroller || window.innerWidth >= 1024) return;
    scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
  }, [snapshot?.id]);

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
  const toggleGroup = (group: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  if (loading || !isAuthenticated || !Number.isFinite(snapshotId)) {
    return <LoadingState label="Loading signal flow…" />;
  }
  if (isSnapshotLoading) {
    return <LoadingState label="Building your routing mind map…" />;
  }
  if (snapshotError || !snapshot?.parsed) return null;

  const parsed = snapshot.parsed as any;
  const mixerName = parsed.metadata?.mixerName || snapshot.filename?.replace(/\.snap$/i, "") || "WING Console";

  const branchProps = { nodeMap, selectedNodeId, setSelectedNodeId };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/snapshot/${snapshotId}`)} aria-label="Back to snapshot">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Interactive routing explorer</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Signal Flow Mind Map</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Select any branch to inspect its real-time upstream and downstream routing.</p>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.11),_transparent_28rem)] p-0 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_28rem)]">
            <div ref={mindMapScrollRef} className="overflow-x-auto p-5 sm:p-8">
              <div className="relative mx-auto min-w-[720px] py-8">
                <div className="pointer-events-none absolute left-1/2 top-[7.5rem] h-[calc(100%-15rem)] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-indigo-300 to-transparent dark:via-indigo-800" />
                <div className="grid grid-cols-[minmax(205px,1fr)_230px_minmax(205px,1fr)] items-center gap-5">
                  <div className="space-y-7">
                    <MindBranch title="Input Sources" icon={<Radio className="h-4 w-4" />} groupKey="inputs" nodes={groups.inputs} defaultType="input" expanded={expandedGroups.has("inputs")} onToggle={toggleGroup} direction="left" {...branchProps} />
                    <MindBranch title="Mixer Channels" icon={<CircleDot className="h-4 w-4" />} groupKey="channels" nodes={groups.channels} defaultType="channel" expanded={expandedGroups.has("channels")} onToggle={toggleGroup} direction="left" {...branchProps} />
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-4 rounded-[2rem] border border-indigo-200 bg-white px-6 py-8 text-center shadow-xl shadow-indigo-500/10 dark:border-indigo-800 dark:bg-slate-900 dark:shadow-indigo-950/40">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/35">
                      <Waypoints className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Signal hub</p>
                      <h2 className="mt-1 break-words text-xl font-bold text-slate-950 dark:text-white">{mixerName}</h2>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">Expand a colored branch to inspect the actual connections in this snapshot.</p>
                  </div>

                  <div className="space-y-7">
                    <MindBranch title="Buses & Matrices" icon={<Layers3 className="h-4 w-4" />} groupKey="mix" nodes={[...groups.buses, ...groups.matrices]} defaultType="bus" expanded={expandedGroups.has("mix")} onToggle={toggleGroup} direction="right" {...branchProps} />
                    <MindBranch title="Physical Outputs" icon={<Speaker className="h-4 w-4" />} groupKey="outputs" nodes={groups.outputs} defaultType="output" expanded={expandedGroups.has("outputs")} onToggle={toggleGroup} direction="right" {...branchProps} />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-indigo-50 px-5 py-2 text-center text-xs font-medium text-indigo-700 dark:border-slate-800 dark:bg-indigo-950/40 dark:text-indigo-300 lg:hidden">Swipe sideways to explore every branch of the mind map.</div>
            <div className="border-t border-slate-200 bg-white/70 px-6 py-4 text-xs text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
              The map organizes the snapshot around its WING console and uses the live routing relationships found in the uploaded `.snap` file. Click a node to open its route inspector.
            </div>
          </Card>

          <RouteInspector node={selectedNode} nodeMap={nodeMap} onClose={() => setSelectedNodeId(null)} />
        </div>
      </main>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
}

function MindBranch({
  title,
  icon,
  groupKey,
  nodes,
  defaultType,
  expanded,
  onToggle,
  direction,
  nodeMap,
  selectedNodeId,
  setSelectedNodeId,
}: {
  title: string;
  icon: React.ReactNode;
  groupKey: string;
  nodes: FlowNode[];
  defaultType: NodeType;
  expanded: boolean;
  onToggle: (key: string) => void;
  direction: "left" | "right";
  nodeMap: Map<string, FlowNode>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string) => void;
}) {
  const style = nodeStyles[defaultType];
  // Rendering every physical I/O point makes a large WING snapshot unreadable.
  // Keep collapsed branches clean, then reveal a representative branch set.
  const visibleNodes = expanded ? nodes.slice(0, 12) : [];

  return (
    <section className={`relative ${direction === "left" ? "pr-8 text-right" : "pl-8 text-left"}`}>
      <div className={`absolute top-8 h-px w-8 ${style.line} ${direction === "left" ? "right-0" : "left-0"}`} />
      <button
        onClick={() => onToggle(groupKey)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 shadow-sm transition hover:-translate-y-0.5 ${style.chip}`}
      >
        {direction === "right" && <span className="mr-2 shrink-0">{icon}</span>}
        <span className="min-w-0 flex-1 font-semibold">{title}</span>
        <span className="ml-3 flex items-center gap-1.5 text-xs font-medium opacity-70">{nodes.length} {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
        {direction === "left" && <span className="ml-2 shrink-0">{icon}</span>}
      </button>

      <div className={`relative mt-3 space-y-2 ${direction === "left" ? "mr-4" : "ml-4"}`}>
        <div className={`absolute bottom-3 top-1 w-px ${style.line} ${direction === "left" ? "right-0" : "left-0"}`} />
        {visibleNodes.map((node) => <MindNode key={node.id} node={node} nodeMap={nodeMap} selected={selectedNodeId === node.id} onSelect={setSelectedNodeId} direction={direction} />)}
        {expanded && nodes.length > visibleNodes.length && (
          <div className="relative z-10 text-xs font-semibold text-indigo-600 dark:text-indigo-400">Showing {visibleNodes.length} of {nodes.length} nodes</div>
        )}
      </div>
    </section>
  );
}

function MindNode({ node, nodeMap, selected, onSelect, direction }: { node: FlowNode; nodeMap: Map<string, FlowNode>; selected: boolean; onSelect: (id: string) => void; direction: "left" | "right" }) {
  const style = nodeStyles[node.type];
  const connectionNodes = [...node.outgoing, ...node.incoming].map((id) => nodeMap.get(id)).filter(Boolean) as FlowNode[];
  return (
    <button
      onClick={() => onSelect(node.id)}
      title={`${node.name}: ${nodeSummary(node)}`}
      className={`group relative z-10 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left shadow-sm transition ${style.chip} ${selected ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950" : "hover:-translate-y-0.5 hover:shadow-md"}`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.icon}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{node.name}</span>
        <span className="block truncate text-[11px] opacity-70">{nodeSummary(node)}</span>
      </span>
      {connectionNodes.length > 0 && <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-bold dark:bg-white/10">{connectionNodes.length}</span>}
      <span className={`pointer-events-none absolute top-1/2 h-px w-4 -translate-y-1/2 ${style.line} ${direction === "left" ? "-right-4" : "-left-4"}`} />
    </button>
  );
}

function RouteInspector({ node, nodeMap, onClose }: { node: FlowNode | null; nodeMap: Map<string, FlowNode>; onClose: () => void }) {
  if (!node) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <Headphones className="h-10 w-10 text-indigo-400" />
        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Route Inspector</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Select a node on the map to see its live inbound and outbound routing connections.</p>
      </Card>
    );
  }

  const style = nodeStyles[node.type];
  const routes = (ids: string[]) => ids.map((id) => nodeMap.get(id)).filter(Boolean) as FlowNode[];
  return (
    <Card className="h-fit border-slate-200 p-5 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-3 w-3 rounded-full ${style.icon}`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{style.label.slice(0, -1)}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{node.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{nodeSummary(node)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close route inspector"><X className="h-4 w-4" /></Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <InfoTile label="Gain / level" value={node.gain === undefined ? "—" : `${node.gain.toFixed(1)} dB`} />
        <InfoTile label="Status" value={node.mute ? "Muted" : node.solo ? "Solo" : "Active"} alert={Boolean(node.mute)} />
      </div>

      <RouteList title="Upstream connections" empty="No upstream route found" nodes={routes(node.incoming)} />
      <RouteList title="Downstream connections" empty="No downstream route found" nodes={routes(node.outgoing)} />
    </Card>
  );
}

function InfoTile({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><p className="text-slate-500">{label}</p><p className={`mt-1 font-semibold ${alert ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{value}</p></div>;
}

function RouteList({ title, empty, nodes }: { title: string; empty: string; nodes: FlowNode[] }) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{title}</h3>
      {nodes.length === 0 ? <p className="mt-2 text-sm text-slate-500">{empty}</p> : <div className="mt-2 space-y-2">{nodes.map((route) => <div key={route.id} className={`rounded-lg border px-3 py-2 text-sm ${nodeStyles[route.type].chip}`}><p className="font-semibold">{route.name}</p><p className="mt-0.5 text-xs opacity-70">{nodeSummary(route)}</p></div>)}</div>}
    </div>
  );
}

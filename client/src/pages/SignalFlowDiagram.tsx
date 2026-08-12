import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface FlowNode {
  id: string;
  type: "input" | "channel" | "bus" | "matrix" | "output";
  name: string;
  index: number;
  group?: string;
  connections: string[];
  gain?: number;
  mute?: boolean;
  solo?: boolean;
}

export default function SignalFlowDiagram() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = parseInt(params.id, 10);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: snapshot, isLoading: isSnapshotLoading, error: snapshotError } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId },
    { enabled: isAuthenticated && !isNaN(snapshotId) }
  );

  useEffect(() => {
    if (isNaN(snapshotId)) setLocation("/404");
  }, [snapshotId, setLocation]);

  useEffect(() => {
    if (snapshotError) {
      toast.error(snapshotError.message);
      setLocation("/uploader");
    }
  }, [snapshotError, setLocation]);

  if (loading || !isAuthenticated || isNaN(snapshotId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-label="Loading signal flow" />
      </div>
    );
  }

  if (isSnapshotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-700 dark:text-slate-300">Loading signal flow diagram...</span>
      </div>
    );
  }

  if (snapshotError || !snapshot || !snapshot.parsed) {
    return null;
  }

  const parsed = snapshot.parsed;

  // Build flow nodes
  const nodes: Map<string, FlowNode> = new Map();

  // Add input nodes
  for (const input of parsed.inputs) {
    const nodeId = `input_${input.group}_${input.index}`;
    nodes.set(nodeId, {
      id: nodeId,
      type: "input",
      name: input.name,
      index: input.index,
      group: input.group,
      connections: [],
      gain: input.gain,
    });
  }

  // Add channel nodes and their connections
  for (const channel of parsed.channels) {
    const nodeId = `channel_${channel.index}`;
    const connections: string[] = [];

    // Add input connection
    if (channel.inputSource) {
      connections.push(`input_${channel.inputSource.group}_${channel.inputSource.index}`);
    }

    // Add routing connections
    for (const route of channel.routes) {
      connections.push(`${route.destination}_${route.index}`);
    }

    nodes.set(nodeId, {
      id: nodeId,
      type: "channel",
      name: channel.name,
      index: channel.index,
      connections,
      gain: channel.gain,
      mute: channel.mute,
      solo: channel.solo,
    });
  }

  // Add bus nodes and their connections
  for (const bus of parsed.buses) {
    const nodeId = `bus_${bus.index}`;
    const connections: string[] = [];

    for (const route of bus.routes) {
      connections.push(`${route.destination}_${route.index}`);
    }

    nodes.set(nodeId, {
      id: nodeId,
      type: "bus",
      name: bus.name,
      index: bus.index,
      connections,
      gain: bus.gain,
      mute: bus.mute,
    });
  }

  // Add matrix nodes and their connections
  for (const matrix of parsed.matrices) {
    const nodeId = `matrix_${matrix.index}`;
    const connections: string[] = [];

    for (const route of matrix.routes) {
      connections.push(`${route.destination}_${route.index}`);
    }

    nodes.set(nodeId, {
      id: nodeId,
      type: "matrix",
      name: matrix.name,
      index: matrix.index,
      connections,
      gain: matrix.gain,
      mute: matrix.mute,
    });
  }

  // Add output nodes
  for (const output of parsed.outputs) {
    const nodeId = `output_${output.group}_${output.index}`;
    nodes.set(nodeId, {
      id: nodeId,
      type: "output",
      name: output.name,
      index: output.index,
      group: output.group,
      connections: [],
      gain: output.level,
    });
  }

  // Build reverse adjacency so every stage can reveal the complete signal path.
  for (const channel of parsed.channels) {
    const channelId = `channel_${channel.index}`;
    if (channel.inputSource) {
      nodes.get(`input_${channel.inputSource.group}_${channel.inputSource.index}`)?.connections.push(channelId);
    }
    for (const route of channel.routes) {
      nodes.get(`${route.destination}_${route.index}`)?.connections.push(channelId);
    }
  }
  for (const bus of parsed.buses) {
    for (const route of bus.routes) {
      nodes.get(`${route.destination}_${route.index}`)?.connections.push(`bus_${bus.index}`);
    }
  }
  for (const matrix of parsed.matrices) {
    for (const route of matrix.routes) {
      nodes.get(`${route.destination}_${route.index}`)?.connections.push(`matrix_${matrix.index}`);
    }
  }

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "input":
        return "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700";
      case "channel":
        return "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700";
      case "bus":
        return "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700";
      case "matrix":
        return "bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700";
      case "output":
        return "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700";
      default:
        return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700";
    }
  };

  const getNodeTooltip = (node: FlowNode) => {
    const status = [node.mute ? "Muted" : "Unmuted", node.solo ? "Solo" : "Not solo"].join(" · ");
    return `${node.name} · ${node.type} ${node.index} · ${node.connections.length} connected stage(s) · ${status}`;
  };

  const getNodeTextColor = (type: string) => {
    switch (type) {
      case "input":
        return "text-green-900 dark:text-green-100";
      case "channel":
        return "text-blue-900 dark:text-blue-100";
      case "bus":
        return "text-purple-900 dark:text-purple-100";
      case "matrix":
        return "text-orange-900 dark:text-orange-100";
      case "output":
        return "text-red-900 dark:text-red-100";
      default:
        return "text-slate-900 dark:text-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Signal Flow Diagram</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Interactive visualization of signal routing through your mixer
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Legend */}
        <Card className="p-6 mb-8 border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Legend</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { type: "input", label: "Physical Inputs", color: "bg-green-100 dark:bg-green-900" },
              { type: "channel", label: "Mixer Channels", color: "bg-blue-100 dark:bg-blue-900" },
              { type: "bus", label: "Mix Buses", color: "bg-purple-100 dark:bg-purple-900" },
              { type: "matrix", label: "Matrices", color: "bg-orange-100 dark:bg-orange-900" },
              { type: "output", label: "Physical Outputs", color: "bg-red-100 dark:bg-red-900" },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${item.color}`} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Signal Flow Visualization */}
        <div className="space-y-6">
          {/* Inputs Section */}
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Physical Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(nodes.values())
                .filter((n) => n.type === "input")
                .map((node) => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getNodeColor(node.type)}`}
                    title={getNodeTooltip(node)}
                    aria-label={getNodeTooltip(node)}
                    onClick={() => toggleExpanded(node.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${getNodeTextColor(node.type)}`}>{node.name}</p>
                        <p className="text-xs opacity-75">
                          {node.group} #{node.index}
                        </p>
                      </div>
                      {node.connections.length > 0 && (
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedNodes.has(node.id) ? "rotate-180" : ""}`} />
                      )}
                    </div>

                    {expandedNodes.has(node.id) && node.connections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                        {node.connections.map((connId) => {
                          const connNode = nodes.get(connId);
                          return connNode ? (
                            <div key={connId} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="w-4 h-4" />
                              <span>{connNode.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>

          {/* Channels Section */}
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Mixer Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(nodes.values())
                .filter((n) => n.type === "channel")
                .map((node) => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getNodeColor(node.type)}`}
                    title={getNodeTooltip(node)}
                    aria-label={getNodeTooltip(node)}
                    onClick={() => toggleExpanded(node.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className={`font-semibold ${getNodeTextColor(node.type)}`}>{node.name}</p>
                        <p className="text-xs opacity-75">Channel {node.index}</p>
                      </div>
                      {node.connections.length > 0 && (
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedNodes.has(node.id) ? "rotate-180" : ""}`} />
                      )}
                    </div>

                    {/* Status indicators */}
                    <div className="flex gap-2 mb-2">
                      {node.mute && <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-800 rounded">Muted</span>}
                      {node.solo && <span className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded">Solo</span>}
                    </div>

                    {expandedNodes.has(node.id) && node.connections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                        {node.connections.map((connId) => {
                          const connNode = nodes.get(connId);
                          return connNode ? (
                            <div key={connId} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="w-4 h-4" />
                              <span>{connNode.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>

          {/* Buses Section */}
          {Array.from(nodes.values()).some((n) => n.type === "bus") && (
            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Mix Buses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(nodes.values())
                  .filter((n) => n.type === "bus")
                  .map((node) => (
                    <div
                      key={node.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getNodeColor(node.type)}`}
                      onClick={() => toggleExpanded(node.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className={`font-semibold ${getNodeTextColor(node.type)}`}>{node.name}</p>
                          <p className="text-xs opacity-75">Bus {node.index}</p>
                        </div>
                        {node.connections.length > 0 && (
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedNodes.has(node.id) ? "rotate-180" : ""}`} />
                        )}
                      </div>

                      {node.mute && <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-800 rounded mb-2 inline-block">Muted</span>}

                      {expandedNodes.has(node.id) && node.connections.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                          {node.connections.map((connId) => {
                            const connNode = nodes.get(connId);
                            return connNode ? (
                              <div key={connId} className="flex items-center gap-2 text-sm">
                                <ArrowRight className="w-4 h-4" />
                                <span>{connNode.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Matrices Section */}
          {Array.from(nodes.values()).some((n) => n.type === "matrix") && (
            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Matrix Mixes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(nodes.values())
                  .filter((n) => n.type === "matrix")
                  .map((node) => (
                    <div
                      key={node.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getNodeColor(node.type)}`}
                      onClick={() => toggleExpanded(node.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className={`font-semibold ${getNodeTextColor(node.type)}`}>{node.name}</p>
                          <p className="text-xs opacity-75">Matrix {node.index}</p>
                        </div>
                        {node.connections.length > 0 && (
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedNodes.has(node.id) ? "rotate-180" : ""}`} />
                        )}
                      </div>

                      {node.mute && <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-800 rounded mb-2 inline-block">Muted</span>}

                      {expandedNodes.has(node.id) && node.connections.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                          {node.connections.map((connId) => {
                            const connNode = nodes.get(connId);
                            return connNode ? (
                              <div key={connId} className="flex items-center gap-2 text-sm">
                                <ArrowRight className="w-4 h-4" />
                                <span>{connNode.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Outputs Section */}
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Physical Outputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(nodes.values())
                .filter((n) => n.type === "output")
                .map((node) => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-lg border-2 ${getNodeColor(node.type)}`}
                  >
                    <p className={`font-semibold ${getNodeTextColor(node.type)}`}>{node.name}</p>
                    <p className="text-xs opacity-75">
                      {node.group} #{node.index}
                    </p>
                    {node.gain !== undefined && (
                      <p className="text-xs mt-2">Level: {node.gain.toFixed(1)} dB</p>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

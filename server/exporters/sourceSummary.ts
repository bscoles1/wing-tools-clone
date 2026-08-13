import type { WingMixerSnapshot } from "../parsers/wingParser";

type RouteLike = { destination?: string; group?: string; index: number };

function normalizeDestination(route: RouteLike) {
  const value = String(route.destination || route.group || "").toLowerCase();
  if (value === "mtx" || value === "matrix") return "matrix";
  if (value === "out" || value === "output") return "output";
  if (value === "bus") return "bus";
  if (value === "ch" || value === "channel") return "channel";
  return value;
}

function joinSources(labels: string[], empty: string) {
  const unique = Array.from(new Set(labels.filter(Boolean)));
  return unique.length ? unique.join("; ") : empty;
}

export function formatPatchSource(source?: { group: string; index: number }) {
  return source ? `${source.group} ${source.index}` : "No source assigned";
}

export function buildRoutingSourceSummaries(snapshot: WingMixerSnapshot) {
  const channelLabel = (index: number) => {
    const channel = snapshot.channels.find((candidate) => candidate.index === index);
    return channel ? `CH ${channel.index} · ${channel.name}` : `CH ${index}`;
  };
  const busLabel = (index: number) => {
    const bus = snapshot.buses.find((candidate) => candidate.index === index);
    return bus ? `Bus ${bus.index} · ${bus.name}` : `Bus ${index}`;
  };
  const matrixLabel = (index: number) => {
    const matrix = snapshot.matrices.find((candidate) => candidate.index === index);
    return matrix ? `Matrix ${matrix.index} · ${matrix.name}` : `Matrix ${index}`;
  };

  const channelSources = new Map(snapshot.channels.map((channel) => [channel.index, channel.inputSource ? `Input · ${formatPatchSource(channel.inputSource)}` : "No input source assigned"]));
  const busSources = new Map(snapshot.buses.map((bus) => {
    const labels = snapshot.channels
      .filter((channel) => channel.routes.some((route) => normalizeDestination(route) === "bus" && route.index === bus.index))
      .map((channel) => channelLabel(channel.index));
    return [bus.index, joinSources(labels, "No channel source detected")];
  }));
  const matrixSources = new Map(snapshot.matrices.map((matrix) => {
    const channelLabels = snapshot.channels
      .filter((channel) => channel.routes.some((route) => normalizeDestination(route) === "matrix" && route.index === matrix.index))
      .map((channel) => channelLabel(channel.index));
    const busLabels = snapshot.buses
      .filter((bus) => bus.routes.some((route) => normalizeDestination(route) === "matrix" && route.index === matrix.index))
      .map((bus) => busLabel(bus.index));
    return [matrix.index, joinSources([...channelLabels, ...busLabels], "No upstream source detected")];
  }));
  const outputSources = new Map(snapshot.outputs.map((output) => {
    const explicit = output.source ? [formatPatchSource(output.source)] : [];
    const channelLabels = snapshot.channels
      .filter((channel) => channel.routes.some((route) => normalizeDestination(route) === "output" && route.index === output.index))
      .map((channel) => channelLabel(channel.index));
    const busLabels = snapshot.buses
      .filter((bus) => bus.routes.some((route) => normalizeDestination(route) === "output" && route.index === output.index))
      .map((bus) => busLabel(bus.index));
    const matrixLabels = snapshot.matrices
      .filter((matrix) => matrix.routes.some((route) => normalizeDestination(route) === "output" && route.index === output.index))
      .map((matrix) => matrixLabel(matrix.index));
    return [output.id, joinSources([...explicit, ...channelLabels, ...busLabels, ...matrixLabels], "No source assigned")];
  }));

  return { channelSources, busSources, matrixSources, outputSources };
}

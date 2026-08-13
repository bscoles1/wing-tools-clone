export interface LintIssue {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  affectedItems: string[];
}

type SnapshotEntity = {
  name?: string;
  index?: number;
  inputSource?: { group?: string; index?: number };
  routes?: Array<{ destination?: string; group?: string; index?: number }>;
  offRoutes?: Array<{ destination?: string; group?: string; index?: number }>;
  mute?: boolean;
  solo?: boolean;
  gain?: number;
  group?: string;
};

function list(value: unknown): SnapshotEntity[] {
  return Array.isArray(value) ? (value as SnapshotEntity[]) : [];
}

function entityName(entity: SnapshotEntity, fallback: string) {
  return entity.name?.trim() || `${fallback}${entity.index ? ` ${entity.index}` : ""}`;
}

export function lintSnapshot(parsedData: unknown): LintIssue[] {
  const parsed = (parsedData ?? {}) as Record<string, unknown>;
  const channels = list(parsed.channels);
  const buses = list(parsed.buses);
  const matrices = list(parsed.matrices);
  const inputs = list(parsed.inputs);
  const issues: LintIssue[] = [];

  const missingCollections = [
    !Array.isArray(parsed.channels) && "channels",
    !Array.isArray(parsed.buses) && "buses",
    !Array.isArray(parsed.matrices) && "matrices",
    !Array.isArray(parsed.inputs) && "inputs",
  ].filter(Boolean) as string[];

  if (missingCollections.length > 0) {
    issues.push({
      severity: "warning",
      rule: "Incomplete Snapshot Data",
      message: `This snapshot is missing normalized ${missingCollections.join(", ")} data. Available routing data was still analyzed safely.`,
      affectedItems: missingCollections,
    });
  }

  const unpatchedChannels = channels.filter((channel) => !channel.inputSource);
  if (unpatchedChannels.length > 0) {
    issues.push({
      severity: "warning",
      rule: "Unpatched Channels",
      message: `${unpatchedChannels.length} channel(s) have no input source assigned.`,
      affectedItems: unpatchedChannels.map((channel) => entityName(channel, "Channel")),
    });
  }

  const unroutedChannels = channels.filter((channel) => (channel.routes?.length ?? 0) === 0);
  if (unroutedChannels.length > 0) {
    issues.push({
      severity: "warning",
      rule: "Unrouted Channels",
      message: `${unroutedChannels.length} channel(s) have no active output routes.`,
      affectedItems: unroutedChannels.map((channel) => entityName(channel, "Channel")),
    });
  }

  const mutedRoutedChannels = channels.filter((channel) => Boolean(channel.mute) && (channel.routes?.length ?? 0) > 0);
  if (mutedRoutedChannels.length > 0) {
    issues.push({
      severity: "info",
      rule: "Muted Routed Channels",
      message: `${mutedRoutedChannels.length} channel(s) are muted but have active routes.`,
      affectedItems: mutedRoutedChannels.map((channel) => entityName(channel, "Channel")),
    });
  }

  const unroutedBuses = buses.filter((bus) => (bus.routes?.length ?? 0) === 0);
  if (unroutedBuses.length > 0) {
    issues.push({
      severity: "warning",
      rule: "Unrouted Buses",
      message: `${unroutedBuses.length} bus(es) have no active output routes.`,
      affectedItems: unroutedBuses.map((bus) => entityName(bus, "Bus")),
    });
  }

  const busesWithoutSends = buses.filter((bus) => !channels.some((channel) =>
    (channel.routes ?? []).some((route) => route.destination === "bus" && route.index === bus.index),
  ));
  if (busesWithoutSends.length > 0) {
    issues.push({
      severity: "warning",
      rule: "Missing Bus Sends",
      message: `${busesWithoutSends.length} bus(es) have no active channel sends.`,
      affectedItems: busesWithoutSends.map((bus) => entityName(bus, "Bus")),
    });
  }

  const unroutedMatrices = matrices.filter((matrix) => (matrix.routes?.length ?? 0) === 0);
  if (unroutedMatrices.length > 0) {
    issues.push({
      severity: "warning",
      rule: "Unrouted Matrices",
      message: `${unroutedMatrices.length} matrix mix(es) have no active output routes.`,
      affectedItems: unroutedMatrices.map((matrix) => entityName(matrix, "Matrix")),
    });
  }

  const offRouteItems = [
    ...channels.flatMap((channel) => (channel.offRoutes ?? []).map((route) => `${entityName(channel, "Channel")} → ${route.group || route.destination || "route"} ${route.index ?? ""}`.trim())),
    ...buses.flatMap((bus) => (bus.offRoutes ?? []).map((route) => `${entityName(bus, "Bus")} → ${route.group || route.destination || "route"} ${route.index ?? ""}`.trim())),
    ...matrices.flatMap((matrix) => (matrix.offRoutes ?? []).map((route) => `${entityName(matrix, "Matrix")} → ${route.group || route.destination || "route"} ${route.index ?? ""}`.trim())),
  ];
  if (offRouteItems.length > 0) {
    issues.push({
      severity: "info",
      rule: "OFF Routes",
      message: `${offRouteItems.length} route(s) are explicitly OFF.`,
      affectedItems: offRouteItems,
    });
  }

  const usedInputs = new Set(
    channels
      .filter((channel) => channel.inputSource?.group && channel.inputSource.index !== undefined)
      .map((channel) => `${channel.inputSource!.group}:${channel.inputSource!.index}`),
  );
  const unusedInputs = inputs.filter((input) => !usedInputs.has(`${input.group}:${input.index}`));
  if (unusedInputs.length > 0) {
    issues.push({
      severity: "info",
      rule: "Unused Inputs",
      message: `${unusedInputs.length} input(s) are not connected to a mixer channel.`,
      affectedItems: unusedInputs.map((input) => `${input.group || "I/O"} #${input.index ?? "?"} — ${entityName(input, "Input")}`),
    });
  }

  const highGainChannels = channels.filter((channel) => (channel.gain ?? 0) > 6);
  if (highGainChannels.length > 0) {
    issues.push({
      severity: "warning",
      rule: "High Gain Levels",
      message: `${highGainChannels.length} channel(s) have gain above 6 dB and may clip.`,
      affectedItems: highGainChannels.map((channel) => `${entityName(channel, "Channel")} (${(channel.gain ?? 0).toFixed(1)} dB)`),
    });
  }

  const soloChannels = channels.filter((channel) => Boolean(channel.solo));
  if (soloChannels.length > 1) {
    issues.push({
      severity: "info",
      rule: "Multiple Solo Channels",
      message: `${soloChannels.length} channel(s) have solo enabled.`,
      affectedItems: soloChannels.map((channel) => entityName(channel, "Channel")),
    });
  }

  return issues;
}

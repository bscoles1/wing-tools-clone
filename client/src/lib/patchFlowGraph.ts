import type { SignalFlowNode, TraceRole } from "./signalFlowTrace";

export type PatchEntityType = "input" | "channel" | "bus" | "matrix" | "output";

export type PatchFlowEntity = SignalFlowNode & {
  id: string;
  type: PatchEntityType;
  name: string;
  index: number;
  group?: string;
  configuredSource?: string;
};

export type PatchFlowGroup = {
  id: string;
  title: string;
  subtitle: string;
  lane: "source" | "channel" | "mix" | "output";
  color: string;
  entities: PatchFlowEntity[];
  x: number;
  y: number;
};

export type PatchFlowLayout = "lanes" | "compact";
export type PatchFlowConnection = { source: string; target: string; sourceGroup: string; targetGroup: string; color: string; active: boolean };

const entityPalette: Record<PatchEntityType, string> = {
  input: "#10b981",
  channel: "#3b82f6",
  bus: "#8b5cf6",
  matrix: "#f59e0b",
  output: "#f43f5e",
};

function titleize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function entitySourceGroup(entity: PatchFlowEntity) {
  if (entity.configuredSource) return entity.configuredSource.split(/\s+/)[0] || "Unassigned";
  return entity.group || "Unassigned";
}

export function getPatchFlowSourceOptions(entities: PatchFlowEntity[]) {
  return Array.from(new Set(entities.map(entitySourceGroup))).sort((left, right) => left.localeCompare(right));
}

export function filterPatchFlowEntities(entities: PatchFlowEntity[], query: string, sourceGroup: string, entityType: "all" | PatchEntityType) {
  const normalizedQuery = query.trim().toLowerCase();
  return entities.filter((entity) => {
    if (entityType !== "all" && entity.type !== entityType) return false;
    if (sourceGroup !== "all" && entitySourceGroup(entity) !== sourceGroup) return false;
    if (!normalizedQuery) return true;
    return [entity.name, entity.group, entity.configuredSource, entity.id, entitySourceGroup(entity)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
}

export function getActivePatchFlowEntities(entities: PatchFlowEntity[]) {
  return entities.filter((entity) => entity.incoming.length > 0 || entity.outgoing.length > 0);
}

export function limitPatchFlowEntities(entities: PatchFlowEntity[], maximumPerDeviceGroup = 48) {
  const counters = new Map<string, number>();
  return entities.filter((entity) => {
    const key = `${entity.type}:${entity.group || "I/O"}`;
    const count = counters.get(key) || 0;
    counters.set(key, count + 1);
    return count < maximumPerDeviceGroup;
  });
}

export function buildPatchFlowGroups(entities: PatchFlowEntity[], layout: PatchFlowLayout = "lanes") {
  const inputs = entities.filter((entity) => entity.type === "input");
  const channels = entities.filter((entity) => entity.type === "channel");
  const buses = entities.filter((entity) => entity.type === "bus");
  const matrices = entities.filter((entity) => entity.type === "matrix");
  const outputs = entities.filter((entity) => entity.type === "output");
  const createDeviceGroups = (members: PatchFlowEntity[], lane: PatchFlowGroup["lane"], prefix: string, color: string) => {
    const byGroup = new Map<string, PatchFlowEntity[]>();
    for (const entity of members) {
      const group = entity.group || "I/O";
      byGroup.set(group, [...(byGroup.get(group) || []), entity]);
    }
    return Array.from(byGroup.entries()).map(([group, groupEntities], index) => ({
      id: `${prefix}:${group}`,
      title: `${titleize(group)} ${lane === "source" ? "Inputs" : "Outputs"}`,
      subtitle: `${groupEntities.length} physical patches`,
      lane,
      color,
      entities: groupEntities,
      x: 40 + (index % 3) * 470,
      y: Math.floor(index / 3) * 185,
    }));
  };
  const inputGroups = createDeviceGroups(inputs, "source", "inputs", entityPalette.input);
  const outputGroups = createDeviceGroups(outputs, "output", "outputs", entityPalette.output);
  if (layout === "compact") {
    const groupStackHeight = 185;
    return [
      ...inputGroups.map((group, index) => ({ ...group, x: 30, y: 40 + index * groupStackHeight })),
      ...(channels.length ? [{ id: "channels", title: "Mixer Inputs", subtitle: `${channels.length} WING channel strips`, lane: "channel" as const, color: entityPalette.channel, entities: channels, x: 420, y: 40 }] : []),
      ...(buses.length ? [{ id: "buses", title: "Mixer Buses", subtitle: `${buses.length} auxiliary and subgroup mixes`, lane: "mix" as const, color: entityPalette.bus, entities: buses, x: 820, y: 40 }] : []),
      ...(matrices.length ? [{ id: "matrices", title: "Matrix Mixes", subtitle: `${matrices.length} matrix destinations`, lane: "mix" as const, color: entityPalette.matrix, entities: matrices, x: 820, y: 245 }] : []),
      ...outputGroups.map((group, index) => ({ ...group, x: 1220, y: 40 + index * groupStackHeight })),
    ];
  }
  const sourceLaneHeight = Math.max(1, Math.ceil(inputGroups.length / 3)) * 185;
  const outputStart = sourceLaneHeight + 605;
  const groups: PatchFlowGroup[] = [
    ...inputGroups.map((group) => ({ ...group, y: group.y + 40 })),
    ...(channels.length ? [{ id: "channels", title: "Mixer Inputs", subtitle: `${channels.length} WING channel strips`, lane: "channel" as const, color: entityPalette.channel, entities: channels, x: 360, y: sourceLaneHeight + 55 }] : []),
    ...(buses.length ? [{ id: "buses", title: "Mixer Buses", subtitle: `${buses.length} auxiliary and subgroup mixes`, lane: "mix" as const, color: entityPalette.bus, entities: buses, x: 50, y: sourceLaneHeight + 320 }] : []),
    ...(matrices.length ? [{ id: "matrices", title: "Matrix Mixes", subtitle: `${matrices.length} matrix destinations`, lane: "mix" as const, color: entityPalette.matrix, entities: matrices, x: 500, y: sourceLaneHeight + 320 }] : []),
    ...outputGroups.map((group) => ({ ...group, y: group.y + outputStart })),
  ];
  return groups;
}

export function buildPatchFlowConnections(entityMap: Map<string, PatchFlowEntity>, groups: PatchFlowGroup[], visibleEntityIds: Set<string>, traceRoles: Map<string, TraceRole>, focusEnabled: boolean) {
  const entityToGroup = new Map<string, string>();
  for (const group of groups) for (const entity of group.entities) entityToGroup.set(entity.id, group.id);
  const connections: PatchFlowConnection[] = [];
  for (const entity of Array.from(entityMap.values())) {
    if (!visibleEntityIds.has(entity.id)) continue;
    for (const target of entity.outgoing) {
      if (!visibleEntityIds.has(target)) continue;
      const sourceGroup = entityToGroup.get(entity.id);
      const targetGroup = entityToGroup.get(target);
      if (!sourceGroup || !targetGroup || sourceGroup === targetGroup) continue;
      const active = traceRoles.has(entity.id) && traceRoles.has(target);
      if (focusEnabled && !active) continue;
      connections.push({ source: entity.id, target, sourceGroup, targetGroup, color: entityPalette[entity.type as PatchEntityType], active });
    }
  }
  return connections;
}

export interface DiffItem {
  type: "added" | "removed" | "modified";
  category: string;
  name: string;
  oldValue?: string;
  newValue?: string;
}

type Route = { group?: string; index?: number };
type Channel = { index: number; name?: string; inputSource?: { group?: string; index?: number }; gain?: number; mute?: boolean; solo?: boolean; routes?: Route[] };
type IndexedEntity = { index: number; name?: string };
type SnapshotModel = { channels?: Channel[]; buses?: IndexedEntity[]; matrices?: IndexedEntity[] };

function routeList(routes: Route[] = []) {
  return routes.map((route) => `${route.group ?? "route"}${route.index ?? ""}`).sort().join(",");
}

function compareIndexedEntities(left: IndexedEntity[] = [], right: IndexedEntity[] = [], category: string): DiffItem[] {
  const leftByIndex = new Map(left.map((item) => [item.index, item]));
  const rightByIndex = new Map(right.map((item) => [item.index, item]));
  const differences: DiffItem[] = [];
  for (const [index, item] of Array.from(leftByIndex.entries())) if (!rightByIndex.has(index)) differences.push({ type: "removed", category, name: item.name || `${category} ${index}` });
  for (const [index, item] of Array.from(rightByIndex.entries())) if (!leftByIndex.has(index)) differences.push({ type: "added", category, name: item.name || `${category} ${index}` });
  return differences;
}

export function compareRoutingSnapshots(left: SnapshotModel | null | undefined, right: SnapshotModel | null | undefined): DiffItem[] {
  const leftChannels = left?.channels ?? [];
  const rightChannels = right?.channels ?? [];
  const leftByIndex = new Map(leftChannels.map((channel) => [channel.index, channel]));
  const rightByIndex = new Map(rightChannels.map((channel) => [channel.index, channel]));
  const differences = compareIndexedEntities(leftChannels, rightChannels, "Channel");

  for (const [index, rightChannel] of Array.from(rightByIndex.entries())) {
    const leftChannel = leftByIndex.get(index);
    if (!leftChannel) continue;
    const changes: string[] = [];
    const leftSource = leftChannel.inputSource ? `${leftChannel.inputSource.group ?? "I/O"}${leftChannel.inputSource.index ?? ""}` : "None";
    const rightSource = rightChannel.inputSource ? `${rightChannel.inputSource.group ?? "I/O"}${rightChannel.inputSource.index ?? ""}` : "None";
    if (leftSource !== rightSource) changes.push(`Input: ${leftSource} → ${rightSource}`);
    if ((leftChannel.gain ?? 0) !== (rightChannel.gain ?? 0)) changes.push(`Gain: ${(leftChannel.gain ?? 0).toFixed(1)}dB → ${(rightChannel.gain ?? 0).toFixed(1)}dB`);
    if (leftChannel.mute !== rightChannel.mute) changes.push(`Mute: ${leftChannel.mute ? "Yes" : "No"} → ${rightChannel.mute ? "Yes" : "No"}`);
    if (leftChannel.solo !== rightChannel.solo) changes.push(`Solo: ${leftChannel.solo ? "Yes" : "No"} → ${rightChannel.solo ? "Yes" : "No"}`);
    const leftRoutes = routeList(leftChannel.routes);
    const rightRoutes = routeList(rightChannel.routes);
    if (leftRoutes !== rightRoutes) changes.push(`Routes: ${leftRoutes || "None"} → ${rightRoutes || "None"}`);
    if (changes.length) differences.push({ type: "modified", category: "Channel", name: leftChannel.name || `Channel ${index}`, oldValue: changes[0], newValue: changes.join("; ") });
  }

  return [...differences, ...compareIndexedEntities(left?.buses, right?.buses, "Bus"), ...compareIndexedEntities(left?.matrices, right?.matrices, "Matrix")];
}

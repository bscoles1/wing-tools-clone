export type SourceTagMap = Record<string, string[]>;

export const suggestedSourceTags = ["Vocals", "Instruments", "Playback", "Wireless", "Talkback", "Stage L", "Stage R", "Spare"];

export function toggleSourceTag(tags: SourceTagMap, inputId: string, tag: string): SourceTagMap {
  const current = tags[inputId] ?? [];
  const next = current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag];
  return { ...tags, [inputId]: next };
}

export function filterSourceIds<T extends { id: string; name?: string; group?: string }>(inputs: T[], tags: SourceTagMap, query: string, activeTag: string | null): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return inputs.filter((input) => {
    const matchesQuery = !normalizedQuery || [input.name, input.group, input.id, ...(tags[input.id] ?? [])].some((value) => value?.toLowerCase().includes(normalizedQuery));
    const matchesTag = !activeTag || (tags[input.id] ?? []).includes(activeTag);
    return matchesQuery && matchesTag;
  });
}

export function buildSourceTagManifest(snapshotId: number, snapshotName: string, inputs: Array<{ id: string; name?: string; group?: string; index?: number }>, tags: SourceTagMap) {
  return {
    snapshotId,
    snapshotName,
    generatedAt: new Date().toISOString(),
    sources: inputs.map((input) => ({ id: input.id, name: input.name || input.id, group: input.group || "I/O", index: input.index, tags: tags[input.id] ?? [] })),
  };
}

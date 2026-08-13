export type SnapshotGeneratorOptions = {
  name: string;
  channelCount: number;
  busCount: number;
  channelPrefix: string;
};

function clampCount(value: number, maximum: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(maximum, Math.floor(value)));
}

function label(prefix: string, index: number) {
  return `${prefix.trim() || "CH"} ${String(index).padStart(2, "0")}`;
}

export function createStarterSnapshot(options: SnapshotGeneratorOptions) {
  const channelCount = clampCount(options.channelCount, 48);
  const busCount = clampCount(options.busCount, 28);
  const snapshotName = options.name.trim() || "WING Starter Snapshot";
  const channels = Object.fromEntries(Array.from({ length: channelCount }, (_, offset) => {
    const index = offset + 1;
    return [String(index), { name: label(options.channelPrefix, index), rt: {} }];
  }));
  const buses = Object.fromEntries(Array.from({ length: busCount }, (_, offset) => {
    const index = offset + 1;
    return [String(index), { name: `BUS ${String(index).padStart(2, "0")}`, rt: {} }];
  }));

  return {
    name: snapshotName,
    model: "WING",
    schema: "snapshot.9",
    ae_data: {
      io: { in: {}, out: {} },
      ch: channels,
      bus: buses,
      mtx: {},
      main: {},
    },
  };
}

export function getStarterSnapshotFilename(name: string) {
  const stem = (name.trim() || "wing-starter-snapshot")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "wing-starter-snapshot";
  return `${stem}.snap`;
}

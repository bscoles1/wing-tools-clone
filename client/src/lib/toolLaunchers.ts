export type SnapshotTool = "routing" | "signal-flow" | "linter" | "source-management";

export const snapshotToolConfig: Record<SnapshotTool, { title: string; description: string; action: string; path: (snapshotId: number) => string }> = {
  routing: { title: "Routing Documentation", description: "Choose a snapshot to open its PDF and Excel documentation exports.", action: "Open documentation", path: (id) => `/snapshot/${id}#exports` },
  "signal-flow": { title: "Signal Flow Diagram", description: "Choose a snapshot to inspect its top-down signal paths and route context.", action: "Open Signal Flow", path: (id) => `/snapshot/${id}/signal-flow` },
  linter: { title: "Snapshot Linter", description: "Choose a snapshot to run routing and configuration diagnostics.", action: "Run linter", path: (id) => `/snapshot/${id}/linter` },
  "source-management": { title: "Source Management", description: "Choose a snapshot to adjust source gains and export a modified .snap file.", action: "Manage sources", path: (id) => `/snapshot/${id}/source-management` },
};

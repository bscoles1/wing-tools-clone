import { describe, expect, it } from "vitest";
import { createStarterSnapshot, getStarterSnapshotFilename } from "./snapshotGenerator";
import { parseWingSnapshot } from "../../../server/parsers/wingParser";

describe("Snapshot Generator", () => {
  it("creates a WING-shaped starter document with the required ae_data sections", () => {
    const snapshot = createStarterSnapshot({ name: "Summer Tour", channelCount: 3, busCount: 2, channelPrefix: "VOC" });

    expect(snapshot).toMatchObject({
      name: "Summer Tour",
      model: "WING",
      schema: "snapshot.9",
      ae_data: { io: { in: {}, out: {} }, mtx: {}, main: {} },
    });
    expect(snapshot.ae_data.ch).toEqual({
      "1": { name: "VOC 01", rt: {} },
      "2": { name: "VOC 02", rt: {} },
      "3": { name: "VOC 03", rt: {} },
    });
    expect(Object.keys(snapshot.ae_data.bus)).toHaveLength(2);
    expect(parseWingSnapshot(snapshot).summary).toMatchObject({ totalChannels: 3, totalInputs: 0, totalOutputs: 0 });
  });

  it("limits counts and generates a download-safe .snap filename", () => {
    const snapshot = createStarterSnapshot({ name: "", channelCount: 99, busCount: Number.NaN, channelPrefix: "" });
    expect(Object.keys(snapshot.ae_data.ch)).toHaveLength(48);
    expect(Object.keys(snapshot.ae_data.bus)).toHaveLength(0);
    expect(getStarterSnapshotFilename("Summer Tour 2026")).toBe("summer-tour-2026.snap");
  });
});

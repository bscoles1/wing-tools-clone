import { describe, expect, it } from "vitest";
import { parseWingSnapshot, serializeWingSnapshot } from "./wingParser";

const validSnapshot = {
  name: "Test Console",
  model: "WING",
  fw: "1.0.0",
  schema: "snapshot.9",
  ae_data: {
    io: {
      in: {
        LCL: {
          "1": { name: "Kick", gain: 12, phantom: 0, stereo: 0 },
        },
      },
      out: {
        LCL: {
          "1": { name: "Main L", level: 0, grp: "main", in: 1 },
        },
      },
    },
    ch: {
      "1": {
        name: "Kick",
        src_grp: "LCL",
        src_in: 1,
        gain: 3,
        mute: 0,
        solo: 0,
        rt: {
          bus: { "1": 1, "2": 0 },
        },
      },
    },
    bus: {
      "1": {
        name: "Drums",
        busmono: 1,
        gain: 0,
        mute: 0,
        rt: { output: { "1": 1 } },
      },
    },
    mtx: {
      "1": {
        name: "Broadcast",
        mtxmono: 0,
        gain: 0,
        mute: 0,
        rt: { output: { "1": 0 } },
      },
    },
    main: {},
  },
};

describe("parseWingSnapshot", () => {
  it("parses ae_data sections and preserves active and OFF routes", () => {
    const parsed = parseWingSnapshot(validSnapshot);

    expect(parsed.metadata.mixerName).toBe("Test Console");
    expect(parsed.inputs).toHaveLength(1);
    expect(parsed.outputs).toHaveLength(1);
    expect(parsed.channels[0]).toMatchObject({
      name: "Kick",
      inputSource: { group: "LCL", index: 1 },
    });
    expect(parsed.channels[0]?.routes).toEqual([
      { destination: "bus", group: "bus", index: 1 },
    ]);
    expect(parsed.channels[0]?.offRoutes).toEqual([
      { destination: "bus", group: "bus", index: 2 },
    ]);
    expect(parsed.matrices[0]?.offRoutes).toEqual([
      { destination: "output", group: "output", index: 1 },
    ]);
    expect(parsed.summary.activeRoutes).toBe(3);
  });

  it("accepts a BOM-prefixed JSON string", () => {
    const parsed = parseWingSnapshot(`\uFEFF${JSON.stringify(validSnapshot)}`);
    expect(parsed.summary.totalChannels).toBe(1);
  });

  it("rejects a document without the required ae_data root", () => {
    expect(() => parseWingSnapshot({ ch: {} })).toThrow(/ae_data root/);
  });

  it("serializes the normalized model back to a WING-shaped document", () => {
    const parsed = parseWingSnapshot(validSnapshot);
    const serialized = serializeWingSnapshot(parsed);

    expect(serialized).toMatchObject({
      name: "Test Console",
      model: "WING",
      ae_data: {
        ch: { "1": { rt: { bus: { "1": 1, "2": 0 } } } },
        mtx: { "1": { rt: { output: { "1": 0 } } } },
      },
    });
  });
});

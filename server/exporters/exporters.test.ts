import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { generateRoutingTableExcel } from "./excelExporter";
import { generateRoutingTablePDF } from "./pdfExporter";
import type { WingMixerSnapshot } from "../parsers/wingParser";

const fixture: WingMixerSnapshot = {
  metadata: { mixerName: "QC WING", mixerModel: "WING", snapshotSchema: "snapshot.9" },
  inputs: [{ id: "LCL_1", name: "Lead Vocal", group: "LCL", index: 1, gain: 24, phantomPower: true, stereoMode: "mono" }],
  outputs: [{ id: "LCL_1", name: "Main L", group: "LCL", index: 1, source: { group: "main", index: 1 }, level: 0 }],
  channels: [{ id: "CH1", index: 1, name: "Lead Vocal", inputSource: { group: "LCL", index: 1 }, routes: [{ destination: "bus", group: "bus", index: 1 }], offRoutes: [], gain: 0, mute: false, solo: false }],
  buses: [{ id: "BUS1", index: 1, name: "Mix 1", isMono: true, routes: [{ destination: "matrix", group: "matrix", index: 1 }], offRoutes: [], gain: 0, mute: false }],
  matrices: [{ id: "MTX1", index: 1, name: "Lobby Matrix", isMono: true, routes: [{ destination: "output", group: "output", index: 1 }], offRoutes: [], gain: 0, mute: false }],
  summary: { totalInputs: 1, totalOutputs: 1, totalChannels: 1, activeRoutes: 1 },
};

describe("routing documentation exporters", () => {
  it("generates a non-empty PDF routing document", async () => {
    const pdf = await generateRoutingTablePDF(fixture);
    expect(pdf.length).toBeGreaterThan(100);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("generates the expected Excel workbook sheets", async () => {
    const workbookBuffer = await generateRoutingTableExcel(fixture);
    const workbook = XLSX.read(workbookBuffer, { type: "buffer" });
    expect(workbook.SheetNames).toEqual(["Physical Inputs", "Mixer Channels", "Physical Outputs", "Mix Buses", "Matrix Mixes", "Routing Cross-Ref", "Summary"]);
    expect(workbook.Sheets["Mixer Channels"]["B2"].v).toBe("Lead Vocal");
    expect(workbook.Sheets["Physical Inputs"]["A1"].v).toBe("Physical Source");
    expect(workbook.Sheets["Mix Buses"]["C1"].v).toBe("Upstream Sources");
    expect(workbook.Sheets["Matrix Mixes"]["C1"].v).toBe("Upstream Sources");
    expect(workbook.Sheets["Mixer Channels"]["C2"].v).toContain("LCL 1");
    expect(workbook.Sheets["Mix Buses"]["C2"].v).toContain("CH 1");
    expect(workbook.Sheets["Matrix Mixes"]["C2"].v).toContain("Bus 1");
    expect(workbook.Sheets["Physical Outputs"]["D2"].v).toContain("main 1");
  });
});

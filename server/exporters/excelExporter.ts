import * as XLSX from "xlsx";
import type { WingMixerSnapshot } from "../parsers/wingParser";

/**
 * Generate an Excel workbook with routing tables from a WING snapshot
 */
export async function generateRoutingTableExcel(snapshot: WingMixerSnapshot): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Physical Inputs
  const inputsData = [["Group", "Index", "Name", "Gain (dB)", "Phantom Power", "Stereo Mode"]];
  for (const input of snapshot.inputs) {
    inputsData.push([
      input.group,
      input.index.toString(),
      input.name,
      (input.gain || 0).toString(),
      input.phantomPower ? "Yes" : "No",
      input.stereoMode || "Mono",
    ]);
  }
  const inputsSheet = XLSX.utils.aoa_to_sheet(inputsData);
  XLSX.utils.book_append_sheet(workbook, inputsSheet, "Physical Inputs");

  // Sheet 2: Mixer Channels
  const channelsData = [["Channel", "Name", "Input Source", "Gain (dB)", "Mute", "Solo", "Routes"]];
  for (const channel of snapshot.channels) {
    const inputSource = channel.inputSource ? `${channel.inputSource.group}${channel.inputSource.index}` : "None";
    const routes = channel.routes.map((r) => `${r.group}${r.index}`).join(", ");
    channelsData.push([
      channel.index.toString(),
      channel.name,
      inputSource,
      (channel.gain || 0).toString(),
      channel.mute ? "Yes" : "No",
      channel.solo ? "Yes" : "No",
      routes || "None",
    ]);
  }
  const channelsSheet = XLSX.utils.aoa_to_sheet(channelsData);
  XLSX.utils.book_append_sheet(workbook, channelsSheet, "Mixer Channels");

  // Sheet 3: Physical Outputs
  const outputsData = [["Group", "Index", "Name", "Source", "Level (dB)"]];
  for (const output of snapshot.outputs) {
    const source = output.source ? `${output.source.group}${output.source.index}` : "None";
    outputsData.push([output.group, output.index.toString(), output.name, source, (output.level || 0).toString()]);
  }
  const outputsSheet = XLSX.utils.aoa_to_sheet(outputsData);
  XLSX.utils.book_append_sheet(workbook, outputsSheet, "Physical Outputs");

  // Sheet 4: Mix Buses
  const busesData = [["Bus", "Name", "Mono", "Gain (dB)", "Mute", "Routes"]];
  for (const bus of snapshot.buses) {
    const routes = bus.routes.map((r) => `${r.group}${r.index}`).join(", ");
    busesData.push([bus.index.toString(), bus.name, bus.isMono ? "Yes" : "No", (bus.gain || 0).toString(), bus.mute ? "Yes" : "No", routes || "None"]);
  }
  const busesSheet = XLSX.utils.aoa_to_sheet(busesData);
  XLSX.utils.book_append_sheet(workbook, busesSheet, "Mix Buses");

  // Sheet 5: Matrix Mixes
  const matricesData = [["Matrix", "Name", "Mono", "Gain (dB)", "Mute", "Routes"]];
  for (const matrix of snapshot.matrices) {
    const routes = matrix.routes.map((r) => `${r.group}${r.index}`).join(", ");
    matricesData.push([
      matrix.index.toString(),
      matrix.name,
      matrix.isMono ? "Yes" : "No",
      (matrix.gain || 0).toString(),
      matrix.mute ? "Yes" : "No",
      routes || "None",
    ]);
  }
  const matricesSheet = XLSX.utils.aoa_to_sheet(matricesData);
  XLSX.utils.book_append_sheet(workbook, matricesSheet, "Matrix Mixes");

  // Sheet 6: Routing Cross-Reference
  const crossRefData = [["Source Type", "Source Index", "Destination Type", "Destination Index", "Count"]];

  // Count channel routes
  for (const channel of snapshot.channels) {
    for (const route of channel.routes) {
      crossRefData.push(["Channel", channel.index.toString(), route.destination, route.index.toString(), "1"]);
    }
  }

  // Count bus routes
  for (const bus of snapshot.buses) {
    for (const route of bus.routes) {
      crossRefData.push(["Bus", bus.index.toString(), route.destination, route.index.toString(), "1"]);
    }
  }

  // Count matrix routes
  for (const matrix of snapshot.matrices) {
    for (const route of matrix.routes) {
      crossRefData.push(["Matrix", matrix.index.toString(), route.destination, route.index.toString(), "1"]);
    }
  }

  const crossRefSheet = XLSX.utils.aoa_to_sheet(crossRefData);
  XLSX.utils.book_append_sheet(workbook, crossRefSheet, "Routing Cross-Ref");

  // Sheet 7: Summary
  const summaryData = [
    ["Mixer Information", ""],
    ["Mixer Name", snapshot.metadata.mixerName || "Unknown"],
    ["Mixer Model", snapshot.metadata.mixerModel || "Unknown"],
    ["Snapshot Schema", snapshot.metadata.snapshotSchema || "Unknown"],
    ["Firmware", snapshot.metadata.firmware || "Unknown"],
    ["", ""],
    ["Summary Statistics", ""],
    ["Total Inputs", snapshot.summary.totalInputs.toString()],
    ["Total Outputs", snapshot.summary.totalOutputs.toString()],
    ["Total Channels", snapshot.summary.totalChannels.toString()],
    ["Total Buses", snapshot.buses.length.toString()],
    ["Total Matrices", snapshot.matrices.length.toString()],
    ["Active Routes", snapshot.summary.activeRoutes.toString()],
    ["", ""],
    ["Generated", new Date().toLocaleString()],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Convert to buffer
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  return excelBuffer as Buffer;
}

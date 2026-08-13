import PDFDocument from "pdfkit";
import type { WingMixerSnapshot } from "../parsers/wingParser";
import { buildRoutingSourceSummaries, formatPatchSource } from "./sourceSummary";

/**
 * Generate a professional routing table PDF from a WING snapshot
 */
export async function generateRoutingTablePDF(snapshot: WingMixerSnapshot): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Add title
      doc.fontSize(24).font("Helvetica-Bold").text("WING Routing Documentation", { align: "center" });
      doc.moveDown(0.5);

      // Add metadata section
      doc.fontSize(10).font("Helvetica").text(`Mixer: ${snapshot.metadata.mixerName || "Unknown"}`, { align: "left" });
      doc.text(`Model: ${snapshot.metadata.mixerModel || "Unknown"}`);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`);
      doc.moveDown(1);

      // Add summary section
      doc.fontSize(14).font("Helvetica-Bold").text("Summary");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Total Inputs: ${snapshot.summary.totalInputs}`);
      doc.text(`Total Outputs: ${snapshot.summary.totalOutputs}`);
      doc.text(`Total Channels: ${snapshot.summary.totalChannels}`);
      doc.text(`Active Routes: ${snapshot.summary.activeRoutes}`);
      doc.moveDown(1);
      const sourceSummaries = buildRoutingSourceSummaries(snapshot);

      // Add physical inputs section
      doc.fontSize(14).font("Helvetica-Bold").text("Physical Inputs");
      doc.moveDown(0.5);

      // Draw inputs table header
      doc.fontSize(9).font("Helvetica-Bold");
      const inputHeaders = ["Physical Source", "Name", "Gain (dB)", "Phantom", "Stereo"];
      const colWidth = 90;
      let x = 40;
      for (const header of inputHeaders) {
        doc.text(header, x, doc.y, { width: colWidth - 5, align: "left" });
        x += colWidth;
      }

      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");

      // Draw inputs rows
      for (const input of snapshot.inputs) {
        x = 40;
        const row = [
          formatPatchSource(input),
          input.name,
          input.gain?.toFixed(1) || "0",
          input.phantomPower ? "Yes" : "No",
          input.stereoMode || "Mono",
        ];

        for (const cell of row) {
          doc.text(cell, x, doc.y, { width: colWidth - 5, align: "left" });
          x += colWidth;
        }
        doc.moveDown(0.4);
      }

      doc.moveDown(1);

      // Add mixer channels section
      doc.fontSize(14).font("Helvetica-Bold").text("Mixer Channels");
      doc.moveDown(0.5);

      // Draw channels table header
      doc.fontSize(9).font("Helvetica-Bold");
      const channelHeaders = ["Ch", "Name", "Input", "Gain", "Mute", "Solo"];
      x = 40;
      for (const header of channelHeaders) {
        doc.text(header, x, doc.y, { width: 80 - 5, align: "left" });
        x += 80;
      }

      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica");

      // Draw channels rows
      for (const channel of snapshot.channels) {
        x = 40;
        const inputSource = sourceSummaries.channelSources.get(channel.index) || "No input source assigned";
        const row = [
          channel.index.toString(),
          channel.name.substring(0, 10),
          inputSource,
          channel.gain?.toFixed(1) || "0",
          channel.mute ? "✓" : "",
          channel.solo ? "✓" : "",
        ];

        for (const cell of row) {
          doc.text(cell, x, doc.y, { width: 80 - 5, align: "left" });
          x += 80;
        }
        doc.moveDown(0.3);
      }

      doc.moveDown(1);

      // Add physical outputs section
      doc.fontSize(14).font("Helvetica-Bold").text("Physical Outputs");
      doc.moveDown(0.5);

      // Draw outputs table header
      doc.fontSize(9).font("Helvetica-Bold");
      const outputHeaders = ["Group", "Index", "Name", "Source", "Level"];
      x = 40;
      for (const header of outputHeaders) {
        doc.text(header, x, doc.y, { width: 100 - 5, align: "left" });
        x += 100;
      }

      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");

      // Draw outputs rows
      for (const output of snapshot.outputs) {
        x = 40;
        const source = sourceSummaries.outputSources.get(output.id) || "No source assigned";
        const row = [
          output.group,
          output.index.toString(),
          output.name,
          source,
          output.level?.toFixed(1) || "0",
        ];

        for (const cell of row) {
          doc.text(cell, x, doc.y, { width: 100 - 5, align: "left" });
          x += 100;
        }
        doc.moveDown(0.4);
      }

      doc.moveDown(1);
      doc.fontSize(14).font("Helvetica-Bold").text("Mix Buses");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica-Bold");
      const busHeaders = ["Bus", "Name", "Upstream Sources", "Routes"];
      x = 40;
      for (const header of busHeaders) {
        doc.text(header, x, doc.y, { width: 130 - 5, align: "left" });
        x += 130;
      }
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica");
      for (const bus of snapshot.buses) {
        x = 40;
        const row = [
          `Bus ${bus.index}`,
          bus.name.substring(0, 14),
          (sourceSummaries.busSources.get(bus.index) || "No channel source detected").substring(0, 32),
          bus.routes.map((route) => `${route.group} ${route.index}`).join(", ") || "None",
        ];
        for (const cell of row) {
          doc.text(cell, x, doc.y, { width: 130 - 5, align: "left" });
          x += 130;
        }
        doc.moveDown(0.35);
      }

      doc.moveDown(1);
      doc.fontSize(14).font("Helvetica-Bold").text("Matrix Mixes");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica-Bold");
      const matrixHeaders = ["Matrix", "Name", "Upstream Sources", "Routes"];
      x = 40;
      for (const header of matrixHeaders) {
        doc.text(header, x, doc.y, { width: 130 - 5, align: "left" });
        x += 130;
      }
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica");
      for (const matrix of snapshot.matrices) {
        x = 40;
        const row = [
          `Matrix ${matrix.index}`,
          matrix.name.substring(0, 14),
          (sourceSummaries.matrixSources.get(matrix.index) || "No upstream source detected").substring(0, 32),
          matrix.routes.map((route) => `${route.group} ${route.index}`).join(", ") || "None",
        ];
        for (const cell of row) {
          doc.text(cell, x, doc.y, { width: 130 - 5, align: "left" });
          x += 130;
        }
        doc.moveDown(0.35);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

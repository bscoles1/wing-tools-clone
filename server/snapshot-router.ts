import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  createSnapshot,
  getSnapshotById,
  getUserSnapshots,
  deleteSnapshot,
  getUserSubscription,
  upsertSubscription,
  hasFeatureAccess,
  hasReachedUploadLimit,
} from "./snapshots";
import { parseWingSnapshot, serializeWingSnapshot } from "./parsers/wingParser";
import { TRPCError } from "@trpc/server";

export const snapshotRouter = router({
  /**
   * Upload and parse a .snap file
   */
  uploadSnapshot: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        fileKey: z.string(),
        fileUrl: z.string().optional(),
        rawJson: z.any(), // The parsed JSON from the .snap file
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check upload limit
      const limitReached = await hasReachedUploadLimit(ctx.user.id);
      if (limitReached) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Upload limit reached. Please upgrade your subscription.",
        });
      }

      try {
        // Parse the snapshot
        const parsed = parseWingSnapshot(input.rawJson);

        // Store in database
        await createSnapshot({
          userId: ctx.user.id,
          filename: input.filename,
          fileKey: input.fileKey,
          fileUrl: input.fileUrl,
          mixerName: parsed.metadata.mixerName,
          mixerModel: parsed.metadata.mixerModel,
          snapshotSchema: parsed.metadata.snapshotSchema,
          totalInputs: parsed.summary.totalInputs,
          totalOutputs: parsed.summary.totalOutputs,
          totalChannels: parsed.summary.totalChannels,
          activeRoutes: parsed.summary.activeRoutes,
          parsedData: JSON.stringify(parsed),
        });

        const userSnapshots = await getUserSnapshots(ctx.user.id);
        const newSnapshot = userSnapshots[userSnapshots.length - 1];

        return {
          success: true,
          snapshotId: newSnapshot?.id || 0,
          summary: parsed.summary,
        };
      } catch (error) {
        console.error("Failed to parse snapshot:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to parse snapshot file. Ensure it is a valid WING .snap file.",
        });
      }
    }),

  /**
   * Get a snapshot by ID
   */
  getSnapshot: protectedProcedure
    .input(z.object({ snapshotId: z.number() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await getSnapshotById(input.snapshotId);

      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found",
        });
      }

      // Verify ownership
      if (snapshot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this snapshot",
        });
      }

      // Parse cached data if available
      let parsed = null;
      if (snapshot.parsedData) {
        try {
          parsed = JSON.parse(snapshot.parsedData);
        } catch (e) {
          console.error("Failed to parse cached snapshot data:", e);
        }
      }

      return {
        ...snapshot,
        parsed,
      };
    }),

  /**
   * List all snapshots for the current user
   */
  listSnapshots: protectedProcedure.query(async ({ ctx }) => {
    return await getUserSnapshots(ctx.user.id);
  }),

  /**
   * Delete a snapshot
   */
  deleteSnapshot: protectedProcedure
    .input(z.object({ snapshotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const snapshot = await getSnapshotById(input.snapshotId);

      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found",
        });
      }

      // Verify ownership
      if (snapshot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this snapshot",
        });
      }

      await deleteSnapshot(input.snapshotId);

      return { success: true };
    }),

  /**
   * Get the current user's subscription
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    let subscription = await getUserSubscription(ctx.user.id);

    // Create default free subscription if it doesn't exist
    if (!subscription) {
      await upsertSubscription({
        userId: ctx.user.id,
        tier: "Free",
      });
      subscription = await getUserSubscription(ctx.user.id);
    }

    return subscription;
  }),

  /**
   * Check if user has access to a feature
   */
  hasFeatureAccess: protectedProcedure
    .input(
      z.object({
        feature: z.enum([
          "routing_table",
          "signal_flow",
          "routing_diff",
          "snapshot_linter",
          "source_management",
        ]),
      })
    )
    .query(async ({ ctx, input }) => {
      return await hasFeatureAccess(ctx.user.id, input.feature);
    }),

  /**
   * Generate PDF routing table for a snapshot
   */
  generatePDF: protectedProcedure
    .input(z.object({ snapshotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const snapshot = await getSnapshotById(input.snapshotId);

      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found",
        });
      }

      // Verify ownership
      if (snapshot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this snapshot",
        });
      }

      // Check feature access
      const hasAccess = await hasFeatureAccess(ctx.user.id, "routing_table");
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This feature is not available on your current plan",
        });
      }

      if (!snapshot.parsedData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Snapshot data not available",
        });
      }

      try {
        const parsed = JSON.parse(snapshot.parsedData);
        const { generateRoutingTablePDF } = await import("./exporters/pdfExporter");
        const pdfBuffer = await generateRoutingTablePDF(parsed);

        return {
          success: true,
          data: pdfBuffer.toString("base64"),
          filename: `${snapshot.filename.replace(".snap", "")}-routing-table.pdf`,
          mimeType: "application/pdf",
        };
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate PDF",
        });
      }
    }),

  /**
   * Generate Excel workbook with routing tables for a snapshot
   */
  generateExcel: protectedProcedure
    .input(z.object({ snapshotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const snapshot = await getSnapshotById(input.snapshotId);

      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found",
        });
      }

      // Verify ownership
      if (snapshot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this snapshot",
        });
      }

      // Check feature access
      const hasAccess = await hasFeatureAccess(ctx.user.id, "routing_table");
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This feature is not available on your current plan",
        });
      }

      if (!snapshot.parsedData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Snapshot data not available",
        });
      }

      try {
        const parsed = JSON.parse(snapshot.parsedData);
        const { generateRoutingTableExcel } = await import("./exporters/excelExporter");
        const excelBuffer = await generateRoutingTableExcel(parsed);

        return {
          success: true,
          data: excelBuffer.toString("base64"),
          filename: `${snapshot.filename.replace(".snap", "")}-routing-table.xlsx`,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      } catch (error) {
        console.error("Failed to generate Excel:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate Excel",
        });
      }
    }),

  /**
   * Export snapshot as modified .snap file (for Source Management)
   */
  exportSnapshot: protectedProcedure
    .input(
      z.object({
        snapshotId: z.number(),
        modifications: z.object({
          // Structure for modifications will be expanded
          // e.g., { inputGains: { "LCL_1": 10 } }
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const snapshot = await getSnapshotById(input.snapshotId);

      if (!snapshot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found",
        });
      }

      // Verify ownership
      if (snapshot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this snapshot",
        });
      }

      // Parse the cached data
      if (!snapshot.parsedData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Snapshot data not available",
        });
      }

      let parsed = JSON.parse(snapshot.parsedData);

      // Apply modifications if provided
      if (input.modifications) {
        // Modifications would be applied here
        // This is a placeholder for future implementation
      }

      // Serialize back to WING format
      const serialized = serializeWingSnapshot(parsed);

      return {
        success: true,
        data: serialized,
        filename: `${snapshot.filename.replace(".snap", "")}-modified.snap`,
      };
    }),
});

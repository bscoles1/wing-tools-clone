import { eq, and } from "drizzle-orm";
import { snapshots, generatedDocuments, subscriptions } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new snapshot record in the database
 */
export async function createSnapshot(data: {
  userId: number;
  filename: string;
  fileKey: string;
  fileUrl?: string;
  mixerName?: string;
  mixerModel?: string;
  snapshotSchema?: string;
  totalInputs?: number;
  totalOutputs?: number;
  totalChannels?: number;
  activeRoutes?: number;
  parsedData?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(snapshots).values(data);
  return result;
}

/**
 * Get a snapshot by ID
 */
export async function getSnapshotById(snapshotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.id, snapshotId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all snapshots for a user
 */
export async function getUserSnapshots(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.userId, userId))
    .orderBy(snapshots.createdAt);

  return result;
}

/**
 * Delete a snapshot (and associated documents)
 */
export async function deleteSnapshot(snapshotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated documents first
  await db.delete(generatedDocuments).where(eq(generatedDocuments.snapshotId, snapshotId));

  // Delete the snapshot
  await db.delete(snapshots).where(eq(snapshots.id, snapshotId));
}

/**
 * Store a generated document reference
 */
export async function createGeneratedDocument(data: {
  snapshotId: number;
  documentType: string;
  fileKey: string;
  fileUrl?: string;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedDocuments).values(data);
  return result;
}

/**
 * Get generated documents for a snapshot
 */
export async function getSnapshotDocuments(snapshotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(generatedDocuments)
    .where(eq(generatedDocuments.snapshotId, snapshotId));

  return result;
}

/**
 * Get a user's subscription
 */
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create or update a user's subscription
 */
export async function upsertSubscription(data: {
  userId: number;
  tier: "Free" | "Basic" | "Premium";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserSubscription(data.userId);

  if (existing) {
    // Update existing subscription
    const updateData: any = {
      tier: data.tier,
      status: data.status || existing.status,
      updatedAt: new Date(),
    };

    if (data.stripeCustomerId) updateData.stripeCustomerId = data.stripeCustomerId;
    if (data.stripeSubscriptionId) updateData.stripeSubscriptionId = data.stripeSubscriptionId;
    if (data.currentPeriodStart) updateData.currentPeriodStart = data.currentPeriodStart;
    if (data.currentPeriodEnd) updateData.currentPeriodEnd = data.currentPeriodEnd;

    await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.userId, data.userId));

    return { ...existing, ...updateData };
  } else {
    // Create new subscription
    const result = await db.insert(subscriptions).values({
      userId: data.userId,
      tier: data.tier,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status || "active",
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    });

    return result;
  }
}

/**
 * All documented workspace tools are available to every authenticated user.
 * Subscription records may remain for historical data compatibility but do not gate access.
 */
export async function hasFeatureAccess(
  _userId: number,
  _feature: "routing_table" | "signal_flow" | "routing_diff" | "snapshot_linter" | "source_management"
): Promise<boolean> {
  return true;
}

/**
 * Uploads are not capped by a plan tier.
 */
export function getUploadLimit(_tier: "Free" | "Basic" | "Premium"): number {
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Uploads are never rejected for subscription limits.
 */
export async function hasReachedUploadLimit(_userId: number): Promise<boolean> {
  return false;
}

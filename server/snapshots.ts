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
  tier: "free" | "basic" | "premium";
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
 * Check if a user has access to a feature based on their tier
 */
export async function hasFeatureAccess(
  userId: number,
  feature: "routing_table" | "signal_flow" | "routing_diff" | "snapshot_linter" | "source_management"
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const tier = subscription?.tier || "free";

  const featureTiers: Record<string, string[]> = {
    routing_table: ["free", "basic", "premium"],
    signal_flow: ["basic", "premium"],
    routing_diff: ["basic", "premium"],
    snapshot_linter: ["premium"],
    source_management: ["basic", "premium"],
  };

  return featureTiers[feature]?.includes(tier) || false;
}

/**
 * Get upload limit for a tier
 */
export function getUploadLimit(tier: "free" | "basic" | "premium"): number {
  const limits: Record<string, number> = {
    free: 5,
    basic: 10,
    premium: 100,
  };
  return limits[tier] || 5;
}

/**
 * Check if a user has reached their upload limit
 */
export async function hasReachedUploadLimit(userId: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const tier = subscription?.tier || "free";
  const limit = getUploadLimit(tier);

  const userSnapshots = await getUserSnapshots(userId);
  return userSnapshots.length >= limit;
}

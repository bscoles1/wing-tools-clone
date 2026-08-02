import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription tiers available in the system.
 * Free: Basic features, limited uploads.
 * Basic: Intermediate features, more uploads.
 * Premium: All features, unlimited uploads.
 */
export const subscriptionTiers = mysqlEnum("tier", ["free", "basic", "premium"]);

/**
 * User subscription information.
 * Tracks the current tier, Stripe customer ID, and subscription status.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTiers.notNull().default("free"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"), // active, canceled, past_due
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Uploaded WING snapshot files.
 * Stores metadata about .snap files uploaded by users.
 */
export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key for storage
  fileUrl: text("fileUrl"), // Presigned S3 URL for download
  mixerName: varchar("mixerName", { length: 255 }), // Extracted from snapshot
  mixerModel: varchar("mixerModel", { length: 255 }), // e.g., "wing", "wing-compact"
  snapshotSchema: varchar("snapshotSchema", { length: 50 }), // e.g., "snapshot.9"
  totalInputs: int("totalInputs"),
  totalOutputs: int("totalOutputs"),
  totalChannels: int("totalChannels"),
  activeRoutes: int("activeRoutes"),
  parsedData: text("parsedData"), // JSON string of normalized internal model (optional, for caching)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

/**
 * Generated documents (PDFs, XLSX files) from snapshots.
 * Tracks exports for user downloads and re-generation.
 */
export const generatedDocuments = mysqlTable("generatedDocuments", {
  id: int("id").autoincrement().primaryKey(),
  snapshotId: int("snapshotId").notNull().references(() => snapshots.id, { onDelete: "cascade" }),
  documentType: varchar("documentType", { length: 50 }).notNull(), // "pdf_routing", "pdf_labels", "xlsx_routing"
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key
  fileUrl: text("fileUrl"), // Presigned S3 URL
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // For temporary presigned URLs
});

export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = typeof generatedDocuments.$inferInsert;
CREATE TABLE `generatedDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotId` int NOT NULL,
	`documentType` varchar(50) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `generatedDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` text,
	`mixerName` varchar(255),
	`mixerModel` varchar(255),
	`snapshotSchema` varchar(50),
	`totalInputs` int,
	`totalOutputs` int,
	`totalChannels` int,
	`activeRoutes` int,
	`parsedData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','basic','premium') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`status` varchar(50) DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `generatedDocuments` ADD CONSTRAINT `generatedDocuments_snapshotId_snapshots_id_fk` FOREIGN KEY (`snapshotId`) REFERENCES `snapshots`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `snapshots` ADD CONSTRAINT `snapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
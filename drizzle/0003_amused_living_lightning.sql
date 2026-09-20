CREATE TABLE `memory_audit_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`entryId` varchar(128),
	`action` enum('WRITE_REQUESTED','WRITE_ACCEPTED','WRITE_DENIED','READ_ALLOWED','READ_DENIED','DELETED','CONSENT_GRANTED','CONSENT_REVOKED') NOT NULL,
	`actor` enum('USER','SYSTEM','AI') NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `memory_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_consents` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`scope` enum('SESSION','WORKING','LONG_TERM') NOT NULL,
	`purpose` text NOT NULL,
	`status` enum('REQUESTED','GRANTED','DENIED','REVOKED','EXPIRED') NOT NULL,
	`requestedAt` timestamp NOT NULL,
	`resolvedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `memory_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_entries` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`scope` enum('SESSION','WORKING','LONG_TERM') NOT NULL,
	`kind` enum('FACT','PREFERENCE','CONTEXT','SUMMARY','INSTRUCTION') NOT NULL,
	`memoryKey` varchar(256) NOT NULL,
	`value` text NOT NULL,
	`source` enum('USER_EXPLICIT','USER_PROFILE','SYSTEM_EXPLICIT','AI_PROPOSAL') NOT NULL,
	`sensitivity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`confidence` varchar(32) NOT NULL,
	`consentStatus` enum('REQUESTED','GRANTED','DENIED','REVOKED','EXPIRED') NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL,
	`deletedAt` timestamp,
	CONSTRAINT `memory_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_long_term_contexts` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`entryIds` json NOT NULL,
	`consentStatus` enum('REQUESTED','GRANTED','DENIED','REVOKED','EXPIRED') NOT NULL,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `memory_long_term_contexts_id` PRIMARY KEY(`id`),
	CONSTRAINT `memory_long_term_contexts_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE TABLE `memory_preferences` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`values` json NOT NULL,
	`consentStatus` enum('REQUESTED','GRANTED','DENIED','REVOKED','EXPIRED') NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `memory_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `memory_preferences_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE TABLE `memory_session_contexts` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`entryIds` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `memory_session_contexts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_user_profiles` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`displayName` varchar(255),
	`locale` varchar(32),
	`timezone` varchar(64),
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `memory_user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `memory_user_profiles_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
CREATE TABLE `memory_working_contexts` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128),
	`entryIds` json NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `memory_working_contexts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `memory_audit_owner_created_idx` ON `memory_audit_events` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `memory_consents_owner_status_idx` ON `memory_consents` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `memory_entries_owner_scope_idx` ON `memory_entries` (`ownerId`,`scope`);--> statement-breakpoint
CREATE INDEX `memory_entries_owner_key_idx` ON `memory_entries` (`ownerId`,`memoryKey`);--> statement-breakpoint
CREATE INDEX `memory_session_owner_session_idx` ON `memory_session_contexts` (`ownerId`,`sessionId`);--> statement-breakpoint
CREATE INDEX `memory_working_owner_run_idx` ON `memory_working_contexts` (`ownerId`,`runId`);
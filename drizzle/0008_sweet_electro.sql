CREATE TABLE `observation_audit_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`recordId` varchar(128),
	`action` enum('RECORD_REQUESTED','RECORD_ACCEPTED','RECORD_REJECTED','RECORD_RETRIEVED','RECORD_DELETED') NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `observation_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observation_records` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128),
	`source` enum('ACCESSIBILITY_TREE','UI_HIERARCHY','OCR','SCREENSHOT','APPLICATION_METADATA') NOT NULL,
	`status` enum('AVAILABLE','UNAVAILABLE') NOT NULL,
	`payloadReference` text,
	`payload` json,
	`signals` json NOT NULL,
	`confidence` json NOT NULL,
	`redactionState` enum('REDACTED','MINIMIZED','RESTRICTED') NOT NULL,
	`capturedAt` timestamp NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `observation_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `observation_audit_owner_run_created_idx` ON `observation_audit_events` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `observation_records_owner_run_captured_idx` ON `observation_records` (`ownerId`,`runId`,`capturedAt`);--> statement-breakpoint
CREATE INDEX `observation_records_source_idx` ON `observation_records` (`source`);
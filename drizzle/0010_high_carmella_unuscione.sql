CREATE TABLE `execution_audit_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128),
	`requestId` varchar(128),
	`resultId` varchar(128),
	`capabilityId` varchar(128),
	`action` enum('REQUESTED','REJECTED','RESULT_RECORDED','CAPABILITY_CHECKED','STATUS_RECORDED') NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `execution_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_capabilities` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`capability` enum('TAP','LONG_PRESS','SWIPE','SCROLL','INPUT_TEXT','LAUNCH_APP','BACK','HOME','APP_SWITCH') NOT NULL,
	`status` enum('AVAILABLE','UNAVAILABLE','NOT_IMPLEMENTED') NOT NULL,
	`reason` text NOT NULL,
	`checkedAt` timestamp NOT NULL,
	CONSTRAINT `execution_capabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_policies` (
	`id` varchar(128) NOT NULL,
	`version` varchar(64) NOT NULL,
	`allowedCapabilities` json NOT NULL,
	`requiresApproval` boolean NOT NULL,
	`maxDurationMs` int NOT NULL,
	`enabled` boolean NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `execution_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_requests` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128),
	`capability` enum('TAP','LONG_PRESS','SWIPE','SCROLL','INPUT_TEXT','LAUNCH_APP','BACK','HOME','APP_SWITCH') NOT NULL,
	`targetReference` varchar(512),
	`parameters` json,
	`policyId` varchar(128) NOT NULL,
	`status` enum('PENDING','ACCEPTED','RUNNING','COMPLETED','FAILED','CANCELLED','INTERRUPTED','NOT_IMPLEMENTED') NOT NULL,
	`reason` text NOT NULL,
	`requestedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `execution_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_results` (
	`id` varchar(128) NOT NULL,
	`requestId` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`status` enum('PENDING','ACCEPTED','RUNNING','COMPLETED','FAILED','CANCELLED','INTERRUPTED','NOT_IMPLEMENTED') NOT NULL,
	`output` json,
	`error` text,
	`completedAt` timestamp NOT NULL,
	CONSTRAINT `execution_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_statuses` (
	`id` varchar(128) NOT NULL,
	`requestId` varchar(128) NOT NULL,
	`status` enum('PENDING','ACCEPTED','RUNNING','COMPLETED','FAILED','CANCELLED','INTERRUPTED','NOT_IMPLEMENTED') NOT NULL,
	`reason` text NOT NULL,
	`changedAt` timestamp NOT NULL,
	CONSTRAINT `execution_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `execution_audit_owner_run_created_idx` ON `execution_audit_events` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `execution_capabilities_owner_capability_idx` ON `execution_capabilities` (`ownerId`,`capability`);--> statement-breakpoint
CREATE INDEX `execution_requests_owner_run_created_idx` ON `execution_requests` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `execution_results_owner_run_completed_idx` ON `execution_results` (`ownerId`,`runId`,`completedAt`);--> statement-breakpoint
CREATE INDEX `execution_statuses_request_changed_idx` ON `execution_statuses` (`requestId`,`changedAt`);
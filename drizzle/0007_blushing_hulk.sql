CREATE TABLE `intervention_audit_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`requestId` varchar(128),
	`responseId` varchar(128),
	`action` enum('REQUESTED','RESPONDED','RESOLVED','EXPIRED','CANCELLED','STATE_TRANSITION') NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `intervention_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intervention_policies` (
	`id` varchar(128) NOT NULL,
	`version` varchar(64) NOT NULL,
	`allowedTypes` json NOT NULL,
	`approvalRequiredFor` json NOT NULL,
	`allowedOutcomes` json NOT NULL,
	`defaultExpiryMs` int NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `intervention_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intervention_requests` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`type` enum('APPROVAL_REQUIRED','USER_CONFIRMATION','CLARIFICATION_REQUIRED','AUTHENTICATION_REQUIRED','SECURITY_DECISION','DEVICE_ACTION_REQUIRED','RECOVERY_ASSISTANCE') NOT NULL,
	`title` varchar(255) NOT NULL,
	`reason` text NOT NULL,
	`requestedAction` text NOT NULL,
	`risk` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`status` enum('OPEN','RESPONDED','RESOLVED','EXPIRED','CANCELLED') NOT NULL,
	`policyId` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL,
	`resolvedAt` timestamp,
	CONSTRAINT `intervention_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intervention_resolutions` (
	`id` varchar(128) NOT NULL,
	`requestId` varchar(128) NOT NULL,
	`responseId` varchar(128) NOT NULL,
	`outcome` enum('APPROVED','REJECTED','CANCELLED','EXPIRED','RESOLVED') NOT NULL,
	`resultingRunState` varchar(64) NOT NULL,
	`resolutionNote` text NOT NULL,
	`resolvedBy` varchar(128) NOT NULL,
	`resolvedAt` timestamp NOT NULL,
	CONSTRAINT `intervention_resolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intervention_responses` (
	`id` varchar(128) NOT NULL,
	`requestId` varchar(128) NOT NULL,
	`responderId` varchar(128) NOT NULL,
	`outcome` enum('APPROVED','REJECTED','CANCELLED','EXPIRED','RESOLVED') NOT NULL,
	`message` text,
	`submittedAt` timestamp NOT NULL,
	CONSTRAINT `intervention_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `intervention_audit_owner_run_created_idx` ON `intervention_audit_events` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `intervention_requests_owner_run_status_idx` ON `intervention_requests` (`ownerId`,`runId`,`status`);--> statement-breakpoint
CREATE INDEX `intervention_resolutions_request_resolved_idx` ON `intervention_resolutions` (`requestId`,`resolvedAt`);--> statement-breakpoint
CREATE INDEX `intervention_responses_request_submitted_idx` ON `intervention_responses` (`requestId`,`submittedAt`);
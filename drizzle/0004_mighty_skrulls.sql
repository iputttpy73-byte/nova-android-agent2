CREATE TABLE `expected_postconditions` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`requiredSignals` json NOT NULL,
	`strategy` enum('STATE_MATCH','CONTENT_MATCH','APP_OPEN','USER_CONFIRMATION') NOT NULL,
	`minimumConfidence` varchar(32) NOT NULL,
	`allowedSources` json NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `expected_postconditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_audit_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128) NOT NULL,
	`recordId` varchar(128),
	`action` enum('VERIFICATION_REQUESTED','EVIDENCE_ACCEPTED','EVIDENCE_REJECTED','RESULT_RECORDED') NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `verification_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_evidence` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128) NOT NULL,
	`source` enum('ACCESSIBILITY','APP_STATE','OCR','SCREENSHOT','NOTIFICATION','USER_CONFIRMATION','SYSTEM') NOT NULL,
	`reference` text,
	`observedSignals` json NOT NULL,
	`confidence` varchar(32) NOT NULL,
	`redactionState` enum('REDACTED','MINIMIZED','RESTRICTED') NOT NULL,
	`capturedAt` timestamp NOT NULL,
	`expiresAt` timestamp,
	CONSTRAINT `verification_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_records` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128) NOT NULL,
	`expectedPostconditionId` varchar(128) NOT NULL,
	`status` enum('PASSED','FAILED','UNCERTAIN','UNAVAILABLE') NOT NULL,
	`evidenceIds` json NOT NULL,
	`resultId` varchar(128),
	`policyVersion` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL,
	`completedAt` timestamp,
	CONSTRAINT `verification_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_results` (
	`id` varchar(128) NOT NULL,
	`recordId` varchar(128) NOT NULL,
	`status` enum('PASSED','FAILED','UNCERTAIN','UNAVAILABLE') NOT NULL,
	`confidence` varchar(32) NOT NULL,
	`matchedSignals` json NOT NULL,
	`missingSignals` json NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `verification_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `expected_postconditions_run_step_idx` ON `expected_postconditions` (`runId`,`stepId`);--> statement-breakpoint
CREATE INDEX `verification_audit_owner_run_created_idx` ON `verification_audit_events` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `verification_evidence_run_step_captured_idx` ON `verification_evidence` (`runId`,`stepId`,`capturedAt`);--> statement-breakpoint
CREATE INDEX `verification_records_run_step_created_idx` ON `verification_records` (`runId`,`stepId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `verification_results_record_created_idx` ON `verification_results` (`recordId`,`createdAt`);
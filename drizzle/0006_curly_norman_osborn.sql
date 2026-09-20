CREATE TABLE `recovery_attempts` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128) NOT NULL,
	`classification` enum('TRANSIENT_FAILURE','VERIFICATION_FAILURE','TIMEOUT','INTERRUPTED','UNKNOWN_FAILURE','UNSUPPORTED_OPERATION') NOT NULL,
	`strategy` enum('RETRY','REOBSERVE','REPLAN','WAIT','HUMAN_INTERVENTION','ABORT') NOT NULL,
	`attemptNumber` int NOT NULL,
	`budgetBefore` json NOT NULL,
	`status` enum('PENDING','STARTED','COMPLETED','FAILED','CANCELLED') NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL,
	`completedAt` timestamp,
	CONSTRAINT `recovery_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recovery_audit_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128) NOT NULL,
	`attemptId` varchar(128),
	`action` enum('RECOVERY_REQUESTED','STRATEGY_SELECTED','RETRY_BUDGET_CONSUMED','RECOVERY_COMPLETED','RECOVERY_ABORTED') NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `recovery_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recovery_policies` (
	`id` varchar(128) NOT NULL,
	`version` varchar(64) NOT NULL,
	`allowedStrategies` json NOT NULL,
	`classificationStrategies` json NOT NULL,
	`defaultStrategy` enum('RETRY','REOBSERVE','REPLAN','WAIT','HUMAN_INTERVENTION','ABORT') NOT NULL,
	`maxAttempts` int NOT NULL,
	`requiresHumanFor` json NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `recovery_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recovery_strategies` (
	`id` varchar(128) NOT NULL,
	`classification` enum('TRANSIENT_FAILURE','VERIFICATION_FAILURE','TIMEOUT','INTERRUPTED','UNKNOWN_FAILURE','UNSUPPORTED_OPERATION') NOT NULL,
	`strategy` enum('RETRY','REOBSERVE','REPLAN','WAIT','HUMAN_INTERVENTION','ABORT') NOT NULL,
	`rationale` text NOT NULL,
	`delayMs` int,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `recovery_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `recovery_attempts_run_step_attempt_idx` ON `recovery_attempts` (`runId`,`stepId`,`attemptNumber`);--> statement-breakpoint
CREATE INDEX `recovery_audit_owner_run_created_idx` ON `recovery_audit_events` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `recovery_strategies_classification_idx` ON `recovery_strategies` (`classification`);
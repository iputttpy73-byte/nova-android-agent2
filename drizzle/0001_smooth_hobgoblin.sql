CREATE TABLE `agent_runs` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`goalId` varchar(128) NOT NULL,
	`state` enum('DRAFT','SUBMITTED','INTENT_PARSING','PLAN_PENDING','READY','EXECUTING','VERIFYING','RECOVERING','HUMAN_INTERVENTION','COMPLETED','PARTIALLY_COMPLETED','FAILED','CANCELLED','BLOCKED','EXPIRED') NOT NULL DEFAULT 'DRAFT',
	`stateVersion` int NOT NULL DEFAULT 0,
	`terminalReason` text,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `agent_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`text` text NOT NULL,
	`priority` enum('LOW','NORMAL','HIGH') NOT NULL DEFAULT 'NORMAL',
	`constraints` json NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intents` (
	`id` varchar(128) NOT NULL,
	`goalId` varchar(128) NOT NULL,
	`desiredOutcome` text NOT NULL,
	`entities` json NOT NULL,
	`constraints` json NOT NULL,
	`requiredCapabilities` json NOT NULL,
	`ambiguities` json NOT NULL,
	`sensitivity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`confidence` varchar(32) NOT NULL,
	`source` enum('USER_GOAL','USER_CLARIFICATION') NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `intents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observations` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`stepId` varchar(128),
	`source` enum('ACCESSIBILITY_TREE','OCR','SCREENSHOT','APP_METADATA','COMBINED') NOT NULL,
	`payloadReference` text,
	`payload` json,
	`confidence` varchar(32) NOT NULL,
	`redactionState` enum('REDACTED','MINIMIZED','RESTRICTED') NOT NULL,
	`capturedAt` timestamp NOT NULL,
	CONSTRAINT `observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_steps` (
	`id` varchar(128) NOT NULL,
	`planId` varchar(128) NOT NULL,
	`position` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`precondition` text NOT NULL,
	`abstractAction` text NOT NULL,
	`expectedPostcondition` text NOT NULL,
	`verificationStrategy` text NOT NULL,
	`risk` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`retryBudget` int NOT NULL,
	CONSTRAINT `plan_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`version` int NOT NULL,
	`requiresApproval` boolean NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_runs_owner_state_idx` ON `agent_runs` (`ownerId`,`state`);--> statement-breakpoint
CREATE INDEX `goals_owner_idx` ON `goals` (`ownerId`);--> statement-breakpoint
CREATE INDEX `intents_goal_idx` ON `intents` (`goalId`);--> statement-breakpoint
CREATE INDEX `observations_run_captured_idx` ON `observations` (`runId`,`capturedAt`);--> statement-breakpoint
CREATE INDEX `plans_run_version_idx` ON `plans` (`runId`,`version`);
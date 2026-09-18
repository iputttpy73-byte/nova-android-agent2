CREATE TABLE `agent_run_events` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`sequence` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`fromState` varchar(64),
	`toState` varchar(64),
	`actor` varchar(32) NOT NULL,
	`reason` text,
	`payload` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `agent_run_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128),
	`actorId` varchar(128) NOT NULL,
	`action` varchar(128) NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `human_intervention_requests` (
	`id` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`reason` text NOT NULL,
	`requestedAction` text NOT NULL,
	`risk` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`status` enum('OPEN','RESOLVED','EXPIRED','CANCELLED') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`resolution` text,
	`createdAt` timestamp NOT NULL,
	`resolvedAt` timestamp,
	CONSTRAINT `human_intervention_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_run_events_run_sequence_idx` ON `agent_run_events` (`runId`,`sequence`);--> statement-breakpoint
CREATE INDEX `audit_events_run_created_idx` ON `audit_events` (`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_events_actor_created_idx` ON `audit_events` (`actorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `interventions_run_status_idx` ON `human_intervention_requests` (`runId`,`status`);
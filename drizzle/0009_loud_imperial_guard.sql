CREATE TABLE `accessibility_actions` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`nodeId` varchar(512),
	`action` enum('TAP','LONG_PRESS','SCROLL','SWIPE','INPUT_TEXT','BACK','HOME','APP_SWITCH') NOT NULL,
	`parameters` json,
	`status` enum('REQUESTED','VALIDATED','DENIED','NOT_IMPLEMENTED') NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `accessibility_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accessibility_audit_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128),
	`eventId` varchar(128),
	`nodeId` varchar(512),
	`actionId` varchar(128),
	`capabilityId` varchar(128),
	`action` enum('EVENT_RECORDED','NODE_RECORDED','ACTION_REQUESTED','ACTION_DENIED','CAPABILITY_CHECKED','RECORD_RETRIEVED') NOT NULL,
	`outcome` enum('SUCCESS','DENIED','FAILED') NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `accessibility_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accessibility_capabilities` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`capability` enum('OBSERVE_UI','READ_HIERARCHY','FIND_NODE','PERFORM_ACTION') NOT NULL,
	`status` enum('AVAILABLE','UNAVAILABLE','NOT_IMPLEMENTED') NOT NULL,
	`reason` text NOT NULL,
	`checkedAt` timestamp NOT NULL,
	CONSTRAINT `accessibility_capabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accessibility_events` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`packageName` varchar(256),
	`nodeId` varchar(512),
	`payload` json,
	`redactionState` enum('REDACTED','MINIMIZED','RESTRICTED') NOT NULL,
	`capturedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `accessibility_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accessibility_nodes` (
	`id` varchar(128) NOT NULL,
	`ownerId` varchar(128) NOT NULL,
	`runId` varchar(128) NOT NULL,
	`eventId` varchar(128),
	`nodeId` varchar(512) NOT NULL,
	`className` varchar(512),
	`text` text,
	`contentDescription` text,
	`bounds` json,
	`clickable` boolean NOT NULL,
	`enabled` boolean NOT NULL,
	`childNodeIds` json NOT NULL,
	`redactionState` enum('REDACTED','MINIMIZED','RESTRICTED') NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `accessibility_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `accessibility_actions_owner_run_created_idx` ON `accessibility_actions` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `accessibility_audit_owner_run_created_idx` ON `accessibility_audit_events` (`ownerId`,`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `accessibility_capabilities_owner_capability_idx` ON `accessibility_capabilities` (`ownerId`,`capability`);--> statement-breakpoint
CREATE INDEX `accessibility_events_owner_run_captured_idx` ON `accessibility_events` (`ownerId`,`runId`,`capturedAt`);--> statement-breakpoint
CREATE INDEX `accessibility_nodes_owner_run_node_idx` ON `accessibility_nodes` (`ownerId`,`runId`,`nodeId`);
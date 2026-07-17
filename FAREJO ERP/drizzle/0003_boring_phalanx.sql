CREATE TABLE `access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`action` varchar(64) NOT NULL DEFAULT 'login',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurrence` enum('once','daily') DEFAULT 'once' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);
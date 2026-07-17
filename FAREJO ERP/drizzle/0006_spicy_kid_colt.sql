CREATE TABLE `insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`imageUrl` text,
	`authorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `link` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurringDays` text;
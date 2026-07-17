CREATE TABLE `insight_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`insightId` int NOT NULL,
	`userId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insight_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insight_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`insightId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insight_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;
CREATE TABLE `meeting_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`userId` int NOT NULL,
	`rsvp` enum('pendente','confirmado','declinado') NOT NULL DEFAULT 'pendente',
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meeting_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`meetingType` enum('operacional','estrategico') NOT NULL DEFAULT 'operacional',
	`scheduledAt` timestamp NOT NULL,
	`durationMin` int NOT NULL DEFAULT 60,
	`agenda` text,
	`notes` text,
	`status` enum('agendada','confirmada','cancelada','realizada') NOT NULL DEFAULT 'agendada',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);

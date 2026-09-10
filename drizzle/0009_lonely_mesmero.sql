CREATE TABLE `whatsapp_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int NOT NULL,
	`phone` varchar(32),
	`enabled` tinyint NOT NULL DEFAULT 0,
	`notifNovaTarefa` tinyint NOT NULL DEFAULT 0,
	`notifReuniao` tinyint NOT NULL DEFAULT 0,
	`notifResumoDiario` tinyint NOT NULL DEFAULT 0,
	`resumoHorario` varchar(5) NOT NULL DEFAULT '08:00',
	`heartbeatUid` varchar(128),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_prefs_id` PRIMARY KEY(`id`)
);

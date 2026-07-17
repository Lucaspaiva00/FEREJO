ALTER TABLE `campaigns` ADD `alertsSent` text DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `tasks` ADD `alertCampaignId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `alertDaysBefore` int;
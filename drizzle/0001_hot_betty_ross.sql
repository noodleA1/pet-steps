CREATE TABLE `aiGenerationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`petId` int,
	`generationType` enum('text_to_image','image_to_image','image_to_video','image_to_3d') NOT NULL,
	`prompt` text,
	`inputImageUrl` text,
	`outputUrl` text,
	`tokensUsed` int NOT NULL DEFAULT 1,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiGenerationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `battles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengerId` int NOT NULL,
	`challengerPetId` int NOT NULL,
	`defenderId` int NOT NULL,
	`defenderPetId` int NOT NULL,
	`winnerId` int,
	`winnerPetId` int,
	`battleLog` json,
	`battleType` enum('ranked','guild','friendly') NOT NULL DEFAULT 'ranked',
	`guildBattleId` int,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `battles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breedingRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`requesterPetId` int NOT NULL,
	`partnerId` int,
	`partnerPetId` int,
	`status` enum('open','pending','accepted','completed','cancelled') NOT NULL DEFAULT 'open',
	`offspringPetId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breedingRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consumables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('food','water','toy','treat') NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consumables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyBattles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`battlesUsed` int NOT NULL DEFAULT 0,
	`maxBattles` int NOT NULL DEFAULT 3,
	CONSTRAINT `dailyBattles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guildCompetitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
	`results` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildCompetitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guildMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','officer','member') NOT NULL DEFAULT 'member',
	`weeklySteps` int NOT NULL DEFAULT 0,
	`totalContributedSteps` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guilds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`leaderId` int NOT NULL,
	`totalSteps` int NOT NULL DEFAULT 0,
	`weeklySteps` int NOT NULL DEFAULT 0,
	`memberCount` int NOT NULL DEFAULT 1,
	`competitionPoints` int NOT NULL DEFAULT 0,
	`competitionRank` int,
	`isPublic` boolean NOT NULL DEFAULT true,
	`maxMembers` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guilds_id` PRIMARY KEY(`id`),
	CONSTRAINT `guilds_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`primaryElement` enum('fire','water','earth','air') NOT NULL,
	`secondaryElement` enum('fire','water','earth','air'),
	`level` int NOT NULL DEFAULT 1,
	`experience` int NOT NULL DEFAULT 0,
	`attack` int NOT NULL DEFAULT 10,
	`defense` int NOT NULL DEFAULT 10,
	`health` int NOT NULL DEFAULT 100,
	`maxHealth` int NOT NULL DEFAULT 100,
	`critRate` float NOT NULL DEFAULT 0.05,
	`happiness` int NOT NULL DEFAULT 100,
	`hunger` int NOT NULL DEFAULT 100,
	`thirst` int NOT NULL DEFAULT 100,
	`lastFed` timestamp NOT NULL DEFAULT (now()),
	`lastWatered` timestamp NOT NULL DEFAULT (now()),
	`lastPlayed` timestamp NOT NULL DEFAULT (now()),
	`evolutionStage` int NOT NULL DEFAULT 0,
	`imageUrl` text,
	`image3dUrl` text,
	`victoryVideoUrl` text,
	`defeatVideoUrl` text,
	`killingBlowVideoUrl` text,
	`isEgg` boolean NOT NULL DEFAULT false,
	`eggStepsRequired` int DEFAULT 0,
	`eggStepsProgress` int DEFAULT 0,
	`parentMomId` int,
	`parentDadId` int,
	`isTemplate` boolean NOT NULL DEFAULT true,
	`templateType` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`isRetired` boolean NOT NULL DEFAULT false,
	`retiredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stepLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`steps` int NOT NULL DEFAULT 0,
	`source` enum('healthkit','googlefit','manual') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stepLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `totalSteps` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dailyStepGoal` int DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `weeklyStepGoal` int DEFAULT 35000 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tutorialCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','tier1','tier2','tier3') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `aiTokens` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `guildId` int;
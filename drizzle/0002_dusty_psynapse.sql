ALTER TABLE `pets` ADD `generation` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `pets` ADD `lineageJson` json;
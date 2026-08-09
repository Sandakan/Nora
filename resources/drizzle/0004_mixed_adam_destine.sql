ALTER TABLE "playlists" ADD COLUMN "is_smart" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "playlists" ADD COLUMN "criteria" text;--> statement-breakpoint
CREATE INDEX "idx_playlists_is_smart" ON "playlists" USING btree ("is_smart");
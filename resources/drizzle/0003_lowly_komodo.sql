ALTER TABLE "songs" ADD COLUMN "skip_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Backfill skip_count from existing skip_events
UPDATE "songs" SET "skip_count" = (
  SELECT COUNT(*)::integer FROM "skip_events"
  WHERE "skip_events"."song_id" = "songs"."id"
);--> statement-breakpoint

CREATE INDEX "idx_songs_skip_count_title" ON "songs" USING btree ("skip_count" DESC NULLS LAST,"title");
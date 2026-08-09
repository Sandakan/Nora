CREATE TABLE "scrobble_queue" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scrobble_queue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"song_id" integer,
	"start_time_secs" integer,
	"operation_type" varchar(20) NOT NULL,
	"track_title" varchar(4096),
	"artist_names" text,
	"status" varchar(10) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scrobble_queue" ADD CONSTRAINT "scrobble_queue_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_scrobble_queue_status" ON "scrobble_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scrobble_queue_created_at" ON "scrobble_queue" USING btree ("created_at");
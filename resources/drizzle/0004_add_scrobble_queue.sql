CREATE TABLE IF NOT EXISTS "scrobble_queue" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"song_id" integer REFERENCES "songs"("id") ON DELETE set null ON UPDATE cascade,
	"start_time_secs" integer,
	"operation_type" varchar(20) NOT NULL,
	"track_title" varchar(4096),
	"artist_names" text,
	"status" varchar(10) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_scrobble_queue_status" ON "scrobble_queue" ("status");
CREATE INDEX IF NOT EXISTS "idx_scrobble_queue_created_at" ON "scrobble_queue" ("created_at");

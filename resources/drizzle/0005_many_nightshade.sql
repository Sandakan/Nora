CREATE TABLE "song_lyrics" (
	"song_id" integer PRIMARY KEY NOT NULL,
	"lyrics_text" text NOT NULL,
	"source" varchar(20) NOT NULL,
	"lyrics_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', "song_lyrics"."lyrics_text")) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "is_lyric_index_built" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "song_lyrics" ADD CONSTRAINT "song_lyrics_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_song_lyrics_vector" ON "song_lyrics" USING gin ("lyrics_vector");
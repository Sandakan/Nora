CREATE TABLE "ignored_artists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ignored_artists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"artist_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ignored_artists_artist_id_unique" UNIQUE("artist_id")
);
--> statement-breakpoint
CREATE TABLE "ignored_duplicate_metadata" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ignored_duplicate_metadata_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"duplicate_group_id" varchar(255) NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ignored_featuring_artists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ignored_featuring_artists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"artist_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ignored_featuring_artists_artist_id_unique" UNIQUE("artist_id")
);
--> statement-breakpoint
CREATE TABLE "user_equalizer_preset" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_equalizer_preset_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"preset_name" varchar(255) DEFAULT 'Default' NOT NULL,
	"frequency_bands" json DEFAULT '[]'::json NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_keyboard_shortcuts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_keyboard_shortcuts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shortcuts" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ignored_artists" ADD CONSTRAINT "ignored_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ignored_duplicate_metadata" ADD CONSTRAINT "ignored_duplicate_metadata_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ignored_featuring_artists" ADD CONSTRAINT "ignored_featuring_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_ignored_artists_artist_id" ON "ignored_artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_ignored_duplicate_metadata_group" ON "ignored_duplicate_metadata" USING btree ("duplicate_group_id");--> statement-breakpoint
CREATE INDEX "idx_ignored_duplicate_metadata_song" ON "ignored_duplicate_metadata" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_ignored_featuring_artists_artist_id" ON "ignored_featuring_artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_user_equalizer_preset_created_at" ON "user_equalizer_preset" USING btree ("created_at" DESC NULLS LAST);
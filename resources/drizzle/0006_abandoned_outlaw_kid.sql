CREATE TABLE "albums_lastfm_tags" (
	"album_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "albums_lastfm_tags_album_id_tag_id_pk" PRIMARY KEY("album_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "artist_similarities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "artist_similarities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source_artist_id" integer NOT NULL,
	"target_artist_id" integer,
	"target_artist_name" varchar(1024) NOT NULL,
	"target_artist_name_ci" "citext" GENERATED ALWAYS AS ("artist_similarities"."target_artist_name"::citext) STORED,
	"target_mbid" varchar(64),
	"target_url" text,
	"match_score" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists_lastfm_tags" (
	"artist_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "artists_lastfm_tags_artist_id_tag_id_pk" PRIMARY KEY("artist_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "lastfm_tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lastfm_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"name_ci" "citext" GENERATED ALWAYS AS ("lastfm_tags"."name"::citext) STORED,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lastfm_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "song_audio_features" (
	"song_id" integer PRIMARY KEY NOT NULL,
	"rms_energy" double precision,
	"crest_factor" double precision,
	"zero_crossing_rate" double precision,
	"spectral_centroid" double precision,
	"low_energy_ratio" double precision,
	"mid_energy_ratio" double precision,
	"high_energy_ratio" double precision,
	"estimated_bpm" double precision,
	"pulse_clarity" double precision,
	"feature_vector" "cube",
	"global_listeners" integer,
	"global_playcount" integer,
	"lastfm_synced_at" timestamp,
	"feature_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_similarities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "song_similarities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source_song_id" integer NOT NULL,
	"target_song_id" integer,
	"target_title" varchar(4096) NOT NULL,
	"target_title_ci" "citext" GENERATED ALWAYS AS ("song_similarities"."target_title"::citext) STORED,
	"target_artist" varchar(1024) NOT NULL,
	"target_artist_ci" "citext" GENERATED ALWAYS AS ("song_similarities"."target_artist"::citext) STORED,
	"target_mbid" varchar(64),
	"target_url" text,
	"match_score" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs_lastfm_tags" (
	"song_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "songs_lastfm_tags_song_id_tag_id_pk" PRIMARY KEY("song_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "play_events" ALTER COLUMN "playback_percentage" SET DATA TYPE numeric(5, 3);--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "mbid" varchar(64);--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "mbid" varchar(64);--> statement-breakpoint
ALTER TABLE "play_events" ADD COLUMN "chosen_by_user" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "mbid" varchar(64);--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "bpm" integer;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "initial_key" varchar(32);--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "replay_gain_track_gain" double precision;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "replay_gain_track_peak" double precision;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "grouping" varchar(512);--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "publisher" varchar(512);--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "is_compilation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "bits_per_sample" integer;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "isrc" varchar(64);--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "enable_smart_auto_play" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "albums_lastfm_tags" ADD CONSTRAINT "albums_lastfm_tags_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "albums_lastfm_tags" ADD CONSTRAINT "albums_lastfm_tags_tag_id_lastfm_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."lastfm_tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artist_similarities" ADD CONSTRAINT "artist_similarities_source_artist_id_artists_id_fk" FOREIGN KEY ("source_artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artist_similarities" ADD CONSTRAINT "artist_similarities_target_artist_id_artists_id_fk" FOREIGN KEY ("target_artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artists_lastfm_tags" ADD CONSTRAINT "artists_lastfm_tags_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artists_lastfm_tags" ADD CONSTRAINT "artists_lastfm_tags_tag_id_lastfm_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."lastfm_tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "song_audio_features" ADD CONSTRAINT "song_audio_features_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "song_similarities" ADD CONSTRAINT "song_similarities_source_song_id_songs_id_fk" FOREIGN KEY ("source_song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "song_similarities" ADD CONSTRAINT "song_similarities_target_song_id_songs_id_fk" FOREIGN KEY ("target_song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "songs_lastfm_tags" ADD CONSTRAINT "songs_lastfm_tags_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "songs_lastfm_tags" ADD CONSTRAINT "songs_lastfm_tags_tag_id_lastfm_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."lastfm_tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_albums_lastfm_tags_album_id" ON "albums_lastfm_tags" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "idx_albums_lastfm_tags_tag_id" ON "albums_lastfm_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_artist_similarities_source" ON "artist_similarities" USING btree ("source_artist_id");--> statement-breakpoint
CREATE INDEX "idx_artist_similarities_target" ON "artist_similarities" USING btree ("target_artist_id");--> statement-breakpoint
CREATE INDEX "idx_artist_similarities_target_mbid" ON "artist_similarities" USING btree ("target_mbid");--> statement-breakpoint
CREATE INDEX "idx_artist_similarities_target_name_ci" ON "artist_similarities" USING btree ("target_artist_name_ci");--> statement-breakpoint
CREATE INDEX "idx_artist_similarities_match_score" ON "artist_similarities" USING btree ("match_score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_artists_lastfm_tags_artist_id" ON "artists_lastfm_tags" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_artists_lastfm_tags_tag_id" ON "artists_lastfm_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_lastfm_tags_name_ci" ON "lastfm_tags" USING btree ("name_ci");--> statement-breakpoint
CREATE INDEX "idx_song_audio_features_lastfm_synced" ON "song_audio_features" USING btree ("lastfm_synced_at");--> statement-breakpoint
CREATE INDEX "idx_song_audio_features_vector" ON "song_audio_features" USING gist ("feature_vector");--> statement-breakpoint
CREATE INDEX "idx_song_similarities_source" ON "song_similarities" USING btree ("source_song_id");--> statement-breakpoint
CREATE INDEX "idx_song_similarities_target" ON "song_similarities" USING btree ("target_song_id");--> statement-breakpoint
CREATE INDEX "idx_song_similarities_target_mbid" ON "song_similarities" USING btree ("target_mbid");--> statement-breakpoint
CREATE INDEX "idx_song_similarities_target_title_ci" ON "song_similarities" USING btree ("target_title_ci");--> statement-breakpoint
CREATE INDEX "idx_song_similarities_match_score" ON "song_similarities" USING btree ("match_score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_songs_lastfm_tags_song_id" ON "songs_lastfm_tags" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_songs_lastfm_tags_tag_id" ON "songs_lastfm_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_albums_mbid" ON "albums" USING btree ("mbid");--> statement-breakpoint
CREATE INDEX "idx_artists_mbid" ON "artists" USING btree ("mbid");--> statement-breakpoint
CREATE INDEX "idx_songs_mbid" ON "songs" USING btree ("mbid");
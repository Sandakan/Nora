CREATE TYPE "public"."artwork_source" AS ENUM('LOCAL', 'REMOTE');--> statement-breakpoint
CREATE TYPE "public"."swatch_type" AS ENUM('VIBRANT', 'LIGHT_VIBRANT', 'DARK_VIBRANT', 'MUTED', 'LIGHT_MUTED', 'DARK_MUTED');--> statement-breakpoint
CREATE TABLE "albums" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "albums_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "albums_artists" (
	"album_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "albums_artists_album_id_artist_id_pk" PRIMARY KEY("album_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "albums_artworks" (
	"album_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "albums_artworks_album_id_artwork_id_pk" PRIMARY KEY("album_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "album_songs" (
	"album_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "album_songs_album_id_song_id_pk" PRIMARY KEY("album_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "artists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(1024) NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists_artworks" (
	"artist_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artists_artworks_artist_id_artwork_id_pk" PRIMARY KEY("artist_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artists_songs" (
	"song_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artists_songs_song_id_artist_id_pk" PRIMARY KEY("song_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "artworks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "artworks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"path" text NOT NULL,
	"source" "artwork_source" DEFAULT 'LOCAL' NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artworks_genres" (
	"genre_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artworks_genres_genre_id_artwork_id_pk" PRIMARY KEY("genre_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artworks_playlists" (
	"playlist_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artworks_playlists_playlist_id_artwork_id_pk" PRIMARY KEY("playlist_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artworks_songs" (
	"song_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artworks_songs_song_id_artwork_id_pk" PRIMARY KEY("song_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "genres_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres_songs" (
	"genre_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "genres_songs_genre_id_song_id_pk" PRIMARY KEY("genre_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "music_folders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "music_folders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"path" text NOT NULL,
	"name" varchar(512) NOT NULL,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"parent_id" integer,
	"is_blacklisted_updated_at" timestamp DEFAULT now() NOT NULL,
	"folder_created_at" timestamp,
	"last_modified_at" timestamp,
	"last_changed_at" timestamp,
	"last_parsed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "music_folders_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "palette_swatches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "palette_swatches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"population" integer NOT NULL,
	"hex" varchar(255) NOT NULL,
	"hsl" json NOT NULL,
	"swatch_type" "swatch_type" DEFAULT 'VIBRANT' NOT NULL,
	"palette_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "palettes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "palettes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"artwork_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "play_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"playback_percentage" numeric(5, 1) NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "play_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "playlists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists_songs" (
	"playlist_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playlists_songs_playlist_id_song_id_pk" PRIMARY KEY("playlist_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "seek_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seek_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"position" numeric(8, 3) NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skip_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skip_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"position" numeric(8, 3) NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "songs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(4096) NOT NULL,
	"duration" numeric(10, 3) NOT NULL,
	"path" text NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"sample_rate" integer,
	"bit_rate" integer,
	"no_of_channels" integer,
	"year" integer,
	"disk_number" integer,
	"track_number" integer,
	"folder_id" integer,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"is_blacklisted_updated_at" timestamp DEFAULT now() NOT NULL,
	"is_favorite_updated_at" timestamp DEFAULT now() NOT NULL,
	"file_created_at" timestamp NOT NULL,
	"file_modified_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "songs_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"is_dark_mode" boolean DEFAULT true NOT NULL,
	"use_system_theme" boolean DEFAULT true NOT NULL,
	"auto_launch_app" boolean DEFAULT false NOT NULL,
	"open_window_maximized_on_start" boolean DEFAULT false NOT NULL,
	"open_window_as_hidden_on_system_start" boolean DEFAULT false NOT NULL,
	"is_mini_player_always_on_top" boolean DEFAULT false NOT NULL,
	"is_musixmatch_lyrics_enabled" boolean DEFAULT true NOT NULL,
	"hide_window_on_close" boolean DEFAULT false NOT NULL,
	"send_song_scrobbling_data_to_lastfm" boolean DEFAULT false NOT NULL,
	"send_song_favorites_data_to_lastfm" boolean DEFAULT false NOT NULL,
	"send_now_playing_song_data_to_lastfm" boolean DEFAULT false NOT NULL,
	"save_lyrics_in_lrc_files_for_supported_songs" boolean DEFAULT true NOT NULL,
	"enable_discord_rpc" boolean DEFAULT true NOT NULL,
	"save_verbose_logs" boolean DEFAULT false NOT NULL,
	"main_window_x" integer,
	"main_window_y" integer,
	"mini_player_x" integer,
	"mini_player_y" integer,
	"main_window_width" integer,
	"main_window_height" integer,
	"mini_player_width" integer,
	"mini_player_height" integer,
	"window_state" varchar(20) DEFAULT 'normal' NOT NULL,
	"recent_searches" json DEFAULT '[]'::json NOT NULL,
	"custom_lrc_files_save_location" text,
	"lastfm_session_name" varchar(255),
	"lastfm_session_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "albums_artists" ADD CONSTRAINT "albums_artists_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "albums_artists" ADD CONSTRAINT "albums_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "albums_artworks" ADD CONSTRAINT "albums_artworks_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "albums_artworks" ADD CONSTRAINT "albums_artworks_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artists_artworks" ADD CONSTRAINT "artists_artworks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artists_artworks" ADD CONSTRAINT "artists_artworks_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artists_songs" ADD CONSTRAINT "artists_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artists_songs" ADD CONSTRAINT "artists_songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artworks_genres" ADD CONSTRAINT "artworks_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artworks_genres" ADD CONSTRAINT "artworks_genres_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artworks_playlists" ADD CONSTRAINT "artworks_playlists_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artworks_playlists" ADD CONSTRAINT "artworks_playlists_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artworks_songs" ADD CONSTRAINT "artworks_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artworks_songs" ADD CONSTRAINT "artworks_songs_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "genres_songs" ADD CONSTRAINT "genres_songs_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "genres_songs" ADD CONSTRAINT "genres_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "music_folders" ADD CONSTRAINT "music_folders_parent_id_music_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."music_folders"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "palette_swatches" ADD CONSTRAINT "palette_swatches_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "palettes" ADD CONSTRAINT "palettes_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "playlists_songs" ADD CONSTRAINT "playlists_songs_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "playlists_songs" ADD CONSTRAINT "playlists_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seek_events" ADD CONSTRAINT "seek_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "skip_events" ADD CONSTRAINT "skip_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_folder_id_music_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."music_folders"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_albums_title" ON "albums" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_albums_year" ON "albums" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_albums_year_title" ON "albums" USING btree ("year","title");--> statement-breakpoint
CREATE INDEX "idx_albums_artists_album_id" ON "albums_artists" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "idx_albums_artists_artist_id" ON "albums_artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_albums_artworks_artwork_id" ON "albums_artworks" USING btree ("artwork_id");--> statement-breakpoint
CREATE INDEX "idx_albums_artworks_album_id" ON "albums_artworks" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "idx_album_songs_album_id" ON "album_songs" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "idx_album_songs_song_id" ON "album_songs" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_artists_name" ON "artists" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_artists_is_favorite" ON "artists" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "idx_artists_artworks_artwork_id" ON "artists_artworks" USING btree ("artwork_id");--> statement-breakpoint
CREATE INDEX "idx_artists_artworks_artist_id" ON "artists_artworks" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_artists_songs_artist_id" ON "artists_songs" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_artists_songs_song_id" ON "artists_songs" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_artworks_path" ON "artworks" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_artworks_source" ON "artworks" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_artworks_dimensions" ON "artworks" USING btree ("width","height");--> statement-breakpoint
CREATE INDEX "idx_artworks_source_dimensions" ON "artworks" USING btree ("source","width","height");--> statement-breakpoint
CREATE INDEX "idx_artworks_genres_genre_id" ON "artworks_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "idx_artworks_genres_artwork_id" ON "artworks_genres" USING btree ("artwork_id");--> statement-breakpoint
CREATE INDEX "idx_artworks_playlists_playlist_id" ON "artworks_playlists" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "idx_artworks_playlists_artwork_id" ON "artworks_playlists" USING btree ("artwork_id");--> statement-breakpoint
CREATE INDEX "idx_artworks_songs_artwork_id" ON "artworks_songs" USING btree ("artwork_id");--> statement-breakpoint
CREATE INDEX "idx_artworks_songs_song_id" ON "artworks_songs" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_genres_name" ON "genres" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_genres_songs_genre_id" ON "genres_songs" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "idx_genres_songs_song_id" ON "genres_songs" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_parent_id" ON "music_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_music_folders_path" ON "music_folders" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_music_folders_is_blacklisted" ON "music_folders" USING btree ("is_blacklisted");--> statement-breakpoint
CREATE INDEX "idx_music_folders_parent_path" ON "music_folders" USING btree ("parent_id","path");--> statement-breakpoint
CREATE INDEX "idx_palette_swatches_palette_id" ON "palette_swatches" USING btree ("palette_id");--> statement-breakpoint
CREATE INDEX "idx_palette_swatches_type" ON "palette_swatches" USING btree ("swatch_type");--> statement-breakpoint
CREATE INDEX "idx_palette_swatches_palette_type" ON "palette_swatches" USING btree ("palette_id","swatch_type");--> statement-breakpoint
CREATE INDEX "idx_palette_swatches_hex" ON "palette_swatches" USING btree ("hex");--> statement-breakpoint
CREATE INDEX "idx_palettes_artwork_id" ON "palettes" USING btree ("artwork_id");--> statement-breakpoint
CREATE INDEX "idx_play_events_song_id" ON "play_events" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_play_events_created_at" ON "play_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_play_events_song_created" ON "play_events" USING btree ("song_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_play_events_percentage" ON "play_events" USING btree ("playback_percentage");--> statement-breakpoint
CREATE INDEX "idx_play_history_song_id" ON "play_history" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_play_history_created_at" ON "play_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_playlists_name" ON "playlists" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_playlists_created_at" ON "playlists" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_playlists_songs_playlist_id" ON "playlists_songs" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "idx_playlists_songs_song_id" ON "playlists_songs" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_seek_events_song_id" ON "seek_events" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_seek_events_created_at" ON "seek_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_seek_events_song_created" ON "seek_events" USING btree ("song_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_skip_events_song_id" ON "skip_events" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "idx_skip_events_created_at" ON "skip_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_skip_events_song_created" ON "skip_events" USING btree ("song_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_songs_title" ON "songs" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_songs_year" ON "songs" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_songs_track_number" ON "songs" USING btree ("track_number");--> statement-breakpoint
CREATE INDEX "idx_songs_created_at" ON "songs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_songs_file_modified_at" ON "songs" USING btree ("file_modified_at");--> statement-breakpoint
CREATE INDEX "idx_songs_folder_id" ON "songs" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "idx_songs_path" ON "songs" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_songs_is_favorite" ON "songs" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "idx_songs_is_blacklisted" ON "songs" USING btree ("is_blacklisted");--> statement-breakpoint
CREATE INDEX "idx_songs_year_title" ON "songs" USING btree ("year","title");--> statement-breakpoint
CREATE INDEX "idx_songs_track_title" ON "songs" USING btree ("track_number","title");--> statement-breakpoint
CREATE INDEX "idx_songs_created_title" ON "songs" USING btree ("created_at","title");--> statement-breakpoint
CREATE INDEX "idx_songs_modified_title" ON "songs" USING btree ("file_modified_at","title");--> statement-breakpoint
CREATE INDEX "idx_songs_favorite_title" ON "songs" USING btree ("is_favorite","title");--> statement-breakpoint
CREATE INDEX "idx_songs_folder_title" ON "songs" USING btree ("folder_id","title");--> statement-breakpoint
CREATE INDEX "idx_user_settings_language" ON "user_settings" USING btree ("language");--> statement-breakpoint
CREATE INDEX "idx_user_settings_window_state" ON "user_settings" USING btree ("window_state");
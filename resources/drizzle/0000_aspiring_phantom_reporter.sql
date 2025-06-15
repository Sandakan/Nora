CREATE TYPE "public"."artwork_source" AS ENUM('LOCAL', 'REMOTE');--> statement-breakpoint
CREATE TYPE "public"."swatch_type" AS ENUM('VIBRANT', 'LIGHT_VIBRANT', 'DARK_VIBRANT', 'MUTED', 'LIGHT_MUTED', 'DARK_MUTED');--> statement-breakpoint
CREATE TABLE "albums" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "albums_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "albums_artists" (
	"album_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	CONSTRAINT "albums_artists_album_id_artist_id_pk" PRIMARY KEY("album_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "albums_artworks" (
	"album_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	CONSTRAINT "albums_artworks_album_id_artwork_id_pk" PRIMARY KEY("album_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "album_songs" (
	"album_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	CONSTRAINT "album_songs_album_id_song_id_pk" PRIMARY KEY("album_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "artists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(1024) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists_artworks" (
	"artist_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	CONSTRAINT "artists_artworks_artist_id_artwork_id_pk" PRIMARY KEY("artist_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artists_songs" (
	"song_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	CONSTRAINT "artists_songs_song_id_artist_id_pk" PRIMARY KEY("song_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "artworks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "artworks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"path" text NOT NULL,
	"source" "artwork_source" DEFAULT 'LOCAL' NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artworks_genres" (
	"genre_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	CONSTRAINT "artworks_genres_genre_id_artwork_id_pk" PRIMARY KEY("genre_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artworks_playlists" (
	"playlist_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	CONSTRAINT "artworks_playlists_playlist_id_artwork_id_pk" PRIMARY KEY("playlist_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artworks_songs" (
	"song_id" integer NOT NULL,
	"artwork_id" integer NOT NULL,
	CONSTRAINT "artworks_songs_song_id_artwork_id_pk" PRIMARY KEY("song_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "folder_blacklist" (
	"folder_id" integer PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "genres_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres_songs" (
	"genre_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	CONSTRAINT "genres_songs_genre_id_song_id_pk" PRIMARY KEY("genre_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "music_folders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "music_folders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"path" text NOT NULL,
	"name" varchar(512) NOT NULL,
	"parent_id" integer,
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
	"hsl" varchar(255) NOT NULL,
	"swatch_type" "swatch_type" DEFAULT 'VIBRANT' NOT NULL,
	"palette_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "palettes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "palettes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"artwork_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "play_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"playback_percentage" numeric(5, 1) NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "playlists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists_songs" (
	"playlist_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	CONSTRAINT "playlists_songs_playlist_id_song_id_pk" PRIMARY KEY("playlist_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "seek_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seek_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"position" numeric(8, 3) NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skip_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skip_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"position" numeric(8, 3) NOT NULL,
	"song_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_blacklist" (
	"song_id" integer PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "songs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(4096) NOT NULL,
	"duration" numeric(10, 3) NOT NULL,
	"path" text NOT NULL,
	"sample_rate" integer,
	"bit_rate" integer,
	"no_of_channels" integer,
	"year" integer,
	"disk_number" integer,
	"track_number" integer,
	"folder_id" integer,
	"file_created_at" timestamp NOT NULL,
	"file_modified_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "songs_path_unique" UNIQUE("path")
);
--> statement-breakpoint
ALTER TABLE "albums_artists" ADD CONSTRAINT "albums_artists_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artists" ADD CONSTRAINT "albums_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artworks" ADD CONSTRAINT "albums_artworks_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artworks" ADD CONSTRAINT "albums_artworks_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_artworks" ADD CONSTRAINT "artists_artworks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_artworks" ADD CONSTRAINT "artists_artworks_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_songs" ADD CONSTRAINT "artists_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_songs" ADD CONSTRAINT "artists_songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks_genres" ADD CONSTRAINT "artworks_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks_genres" ADD CONSTRAINT "artworks_genres_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks_playlists" ADD CONSTRAINT "artworks_playlists_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks_playlists" ADD CONSTRAINT "artworks_playlists_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks_songs" ADD CONSTRAINT "artworks_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artworks_songs" ADD CONSTRAINT "artworks_songs_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_blacklist" ADD CONSTRAINT "folder_blacklist_folder_id_music_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."music_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genres_songs" ADD CONSTRAINT "genres_songs_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genres_songs" ADD CONSTRAINT "genres_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_folders" ADD CONSTRAINT "music_folders_parent_id_music_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."music_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_swatches" ADD CONSTRAINT "palette_swatches_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palettes" ADD CONSTRAINT "palettes_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_events" ADD CONSTRAINT "play_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists_songs" ADD CONSTRAINT "playlists_songs_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists_songs" ADD CONSTRAINT "playlists_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seek_events" ADD CONSTRAINT "seek_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skip_events" ADD CONSTRAINT "skip_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_blacklist" ADD CONSTRAINT "song_blacklist_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_folder_id_music_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."music_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_parent_id" ON "music_folders" USING btree ("parent_id");
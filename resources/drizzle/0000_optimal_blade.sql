CREATE TABLE "albums" (
	"album_id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"artwork_id" integer,
	CONSTRAINT "albums_album_id_unique" UNIQUE("album_id")
);
--> statement-breakpoint
CREATE TABLE "albums_artists" (
	"album_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	CONSTRAINT "albums_artists_album_id_artist_id_pk" PRIMARY KEY("album_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "albums_artists_songs" (
	"album_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	CONSTRAINT "albums_artists_songs_album_id_song_id_artist_id_pk" PRIMARY KEY("album_id","song_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"artist_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"artwork_id" integer,
	"online_artist_artwork_id" integer,
	CONSTRAINT "artists_artist_id_unique" UNIQUE("artist_id"),
	CONSTRAINT "artists_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "artists_songs" (
	"song_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	CONSTRAINT "artists_songs_song_id_artist_id_pk" PRIMARY KEY("song_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "artworks" (
	"artwork_id" integer PRIMARY KEY NOT NULL,
	"file_path" text NOT NULL,
	CONSTRAINT "artworks_artwork_id_unique" UNIQUE("artwork_id"),
	CONSTRAINT "artworks_file_path_unique" UNIQUE("file_path")
);
--> statement-breakpoint
CREATE TABLE "folder_blacklist" (
	"folder_blacklist_id" integer PRIMARY KEY NOT NULL,
	"folder_path" text NOT NULL,
	CONSTRAINT "folder_blacklist_folder_blacklist_id_unique" UNIQUE("folder_blacklist_id"),
	CONSTRAINT "folder_blacklist_folder_path_unique" UNIQUE("folder_path")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"genre_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"artwork_id" integer,
	"palette_id" integer,
	CONSTRAINT "genres_genre_id_unique" UNIQUE("genre_id"),
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "genres_songs" (
	"song_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "genres_songs_song_id_genre_id_pk" PRIMARY KEY("song_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "listening_data" (
	"listening_data_id" integer PRIMARY KEY NOT NULL,
	"skip_count" integer DEFAULT 0 NOT NULL,
	"full_listens_count" integer DEFAULT 0 NOT NULL,
	"added_playlist_count" integer DEFAULT 0 NOT NULL,
	"song_id" integer NOT NULL,
	CONSTRAINT "listening_data_listening_data_id_unique" UNIQUE("listening_data_id")
);
--> statement-breakpoint
CREATE TABLE "online_artist_artworks" (
	"online_artist_artwork_id" integer PRIMARY KEY NOT NULL,
	"small_artwork_path" text NOT NULL,
	"medium_artwork_path" text NOT NULL,
	"large_artwork_path" text,
	CONSTRAINT "online_artist_artworks_online_artist_artwork_id_unique" UNIQUE("online_artist_artwork_id")
);
--> statement-breakpoint
CREATE TABLE "palette_swatches" (
	"palette_swatch_id" integer PRIMARY KEY NOT NULL,
	"population" integer NOT NULL,
	"hex" text NOT NULL,
	"hsl" text NOT NULL,
	"swatch_type_id" integer NOT NULL,
	"palette_id" integer NOT NULL,
	CONSTRAINT "palette_swatches_palette_swatch_id_unique" UNIQUE("palette_swatch_id")
);
--> statement-breakpoint
CREATE TABLE "palettes" (
	"palette_id" integer PRIMARY KEY NOT NULL,
	CONSTRAINT "palettes_palette_id_unique" UNIQUE("palette_id")
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"playlist_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"artwork_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playlists_playlist_id_unique" UNIQUE("playlist_id"),
	CONSTRAINT "playlists_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "playlists_songs" (
	"playlist_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	CONSTRAINT "playlists_songs_playlist_id_song_id_pk" PRIMARY KEY("playlist_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "song_blacklist" (
	"song_blacklist_id" integer PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	CONSTRAINT "song_blacklist_song_blacklist_id_unique" UNIQUE("song_blacklist_id"),
	CONSTRAINT "song_blacklist_song_id_unique" UNIQUE("song_id")
);
--> statement-breakpoint
CREATE TABLE "song_listens" (
	"song_listen_id" integer PRIMARY KEY NOT NULL,
	"listen_count" integer DEFAULT 0 NOT NULL,
	"listened_at" timestamp DEFAULT now() NOT NULL,
	"yearly_listen_id" integer NOT NULL,
	CONSTRAINT "song_listens_song_listen_id_unique" UNIQUE("song_listen_id")
);
--> statement-breakpoint
CREATE TABLE "song_seeks" (
	"song_seek_id" integer PRIMARY KEY NOT NULL,
	"position" double precision NOT NULL,
	"seek_count" integer NOT NULL,
	"listening_data_id" integer NOT NULL,
	CONSTRAINT "song_seeks_song_seek_id_unique" UNIQUE("song_seek_id")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"song_id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"duration" double precision DEFAULT 0 NOT NULL,
	"path" text NOT NULL,
	"sample_rate" integer,
	"bit_rate" integer,
	"no_of_channels" integer,
	"file_created_at" timestamp NOT NULL,
	"file_modified_at" timestamp NOT NULL,
	"artwork_id" integer,
	"album_id" integer,
	"palette_id" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	"year" integer,
	"disk_number" integer,
	"track_number" integer,
	CONSTRAINT "songs_song_id_unique" UNIQUE("song_id"),
	CONSTRAINT "songs_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "swatch_types" (
	"swatch_type_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "swatch_types_swatch_type_id_unique" UNIQUE("swatch_type_id"),
	CONSTRAINT "swatch_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_data" (
	"id" integer PRIMARY KEY NOT NULL,
	CONSTRAINT "user_data_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "yearly_listens" (
	"yearly_listen_id" integer PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"listening_data_id" integer NOT NULL,
	CONSTRAINT "yearly_listens_yearly_listen_id_unique" UNIQUE("yearly_listen_id")
);
--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_artwork_id_artworks_artwork_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("artwork_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artists" ADD CONSTRAINT "albums_artists_album_id_albums_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("album_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artists" ADD CONSTRAINT "albums_artists_artist_id_artists_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("artist_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artists_songs" ADD CONSTRAINT "albums_artists_songs_album_id_albums_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("album_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artists_songs" ADD CONSTRAINT "albums_artists_songs_song_id_songs_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums_artists_songs" ADD CONSTRAINT "albums_artists_songs_artist_id_artists_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("artist_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_artwork_id_artworks_artwork_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("artwork_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_online_artist_artwork_id_online_artist_artworks_online_artist_artwork_id_fk" FOREIGN KEY ("online_artist_artwork_id") REFERENCES "public"."online_artist_artworks"("online_artist_artwork_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_songs" ADD CONSTRAINT "artists_songs_song_id_songs_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists_songs" ADD CONSTRAINT "artists_songs_artist_id_artists_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("artist_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genres" ADD CONSTRAINT "genres_artwork_id_artworks_artwork_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("artwork_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genres" ADD CONSTRAINT "genres_palette_id_palettes_palette_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("palette_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genres_songs" ADD CONSTRAINT "genres_songs_song_id_songs_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genres_songs" ADD CONSTRAINT "genres_songs_genre_id_genres_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("genre_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_data" ADD CONSTRAINT "listening_data_song_id_songs_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_swatches" ADD CONSTRAINT "palette_swatches_swatch_type_id_swatch_types_swatch_type_id_fk" FOREIGN KEY ("swatch_type_id") REFERENCES "public"."swatch_types"("swatch_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_swatches" ADD CONSTRAINT "palette_swatches_palette_id_palettes_palette_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("palette_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_artwork_id_artworks_artwork_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("artwork_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists_songs" ADD CONSTRAINT "playlists_songs_playlist_id_playlists_playlist_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("playlist_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists_songs" ADD CONSTRAINT "playlists_songs_song_id_songs_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_blacklist" ADD CONSTRAINT "song_blacklist_song_id_songs_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("song_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_listens" ADD CONSTRAINT "song_listens_yearly_listen_id_yearly_listens_yearly_listen_id_fk" FOREIGN KEY ("yearly_listen_id") REFERENCES "public"."yearly_listens"("yearly_listen_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_seeks" ADD CONSTRAINT "song_seeks_listening_data_id_listening_data_listening_data_id_fk" FOREIGN KEY ("listening_data_id") REFERENCES "public"."listening_data"("listening_data_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_artwork_id_artworks_artwork_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("artwork_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_album_id_albums_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("album_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_palette_id_palettes_palette_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("palette_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_listens" ADD CONSTRAINT "yearly_listens_listening_data_id_listening_data_listening_data_id_fk" FOREIGN KEY ("listening_data_id") REFERENCES "public"."listening_data"("listening_data_id") ON DELETE no action ON UPDATE no action;
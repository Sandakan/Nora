import {
  pgTable,
  pgEnum,
  varchar,
  integer,
  timestamp,
  decimal,
  text,
  primaryKey
} from 'drizzle-orm/pg-core';

// Enums
export const artworkSourceEnum = pgEnum('artwork_source', ['LOCAL', 'REMOTE']);
export const swatchTypeEnum = pgEnum('swatch_type', [
  'VIBRANT',
  'LIGHT_VIBRANT',
  'DARK_VIBRANT',
  'MUTED',
  'LIGHT_MUTED',
  'DARK_MUTED'
]);

// Tables
export const artists = pgTable('artists', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 1024 }).notNull()
});

export const songs = pgTable('songs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: varchar('title', { length: 4096 }).notNull(),
  duration: decimal('duration', { precision: 10, scale: 3 }).notNull(),
  path: text('path').notNull().unique(),
  sampleRate: integer('sample_rate'),
  bitRate: integer('bit_rate'),
  noOfChannels: integer('no_of_channels'),
  year: integer('year'),
  diskNumber: integer('disk_number'),
  trackNumber: integer('track_number'),
  fileCreatedAt: timestamp('file_created_at', { withTimezone: false }).notNull(),
  fileModifiedAt: timestamp('file_modified_at', { withTimezone: false }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

export const artworks = pgTable('artworks', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  path: text('path').notNull(),
  source: artworkSourceEnum('source').notNull().default('LOCAL'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const palettes = pgTable('palettes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  artworkId: integer('artwork_id')
    .notNull()
    .references(() => artworks.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const paletteSwatches = pgTable('palette_swatches', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  population: integer('population').notNull(),
  hex: varchar('hex', { length: 255 }).notNull(),
  hsl: varchar('hsl', { length: 255 }).notNull(),
  swatchType: swatchTypeEnum('swatch_type').notNull().default('VIBRANT'),
  paletteId: integer('palette_id')
    .notNull()
    .references(() => palettes.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const albums = pgTable('albums', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: varchar('title', { length: 255 }).notNull(),
  year: integer('year'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const genres = pgTable('genres', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const playlists = pgTable('playlists', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const playEvents = pgTable('play_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  playbackPercentage: decimal('playback_percentage', { precision: 5, scale: 1 }).notNull(),
  songId: integer('song_id')
    .notNull()
    .references(() => songs.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const seekEvents = pgTable('seek_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  position: decimal('position', { precision: 8, scale: 3 }).notNull(),
  songId: integer('song_id')
    .notNull()
    .references(() => songs.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const skipEvents = pgTable('skip_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  position: decimal('position', { precision: 8, scale: 3 }).notNull(),
  songId: integer('song_id')
    .notNull()
    .references(() => songs.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const songBlacklist = pgTable('song_blacklist', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  songId: integer('song_id')
    .notNull()
    .unique()
    .references(() => songs.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const folderBlacklist = pgTable('folder_blacklist', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  path: text('path').notNull().unique()
});

// Many-to-many linking tables
export const artworksSongs = pgTable(
  'artworks_songs',
  {
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id)
  },
  (table) => [primaryKey({ columns: [table.songId, table.artworkId] })]
);

export const artistsArtworks = pgTable(
  'artists_artworks',
  {
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id)
  },
  (table) => [primaryKey({ columns: [table.artistId, table.artworkId] })]
);

export const albumsArtworks = pgTable(
  'albums_artworks',
  {
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id)
  },
  (table) => [primaryKey({ columns: [table.albumId, table.artworkId] })]
);

export const artistsSongs = pgTable(
  'artists_songs',
  {
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id)
  },
  (table) => [primaryKey({ columns: [table.songId, table.artistId] })]
);

export const albumsSongs = pgTable(
  'album_songs',
  {
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id)
  },
  (table) => [primaryKey({ columns: [table.albumId, table.songId] })]
);

export const genresSongs = pgTable(
  'genres_songs',
  {
    genreId: integer('genre_id')
      .notNull()
      .references(() => genres.id),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id)
  },
  (table) => [primaryKey({ columns: [table.genreId, table.songId] })]
);

export const artworksGenres = pgTable(
  'artworks_genres',
  {
    genreId: integer('genre_id')
      .notNull()
      .references(() => genres.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id)
  },
  (table) => [primaryKey({ columns: [table.genreId, table.artworkId] })]
);

export const playlistsSongs = pgTable(
  'playlists_songs',
  {
    playlistId: integer('playlist_id')
      .notNull()
      .references(() => playlists.id),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id)
  },
  (table) => [primaryKey({ columns: [table.playlistId, table.songId] })]
);

export const artworksPlaylists = pgTable(
  'artworks_playlists',
  {
    playlistId: integer('playlist_id')
      .notNull()
      .references(() => playlists.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id)
  },
  (table) => [primaryKey({ columns: [table.playlistId, table.artworkId] })]
);

export const albumsArtists = pgTable(
  'albums_artists',
  {
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id),
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id)
  },
  (table) => [primaryKey({ columns: [table.albumId, table.artistId] })]
);

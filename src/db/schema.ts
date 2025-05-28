import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  doublePrecision,
  uniqueIndex,
  primaryKey
} from 'drizzle-orm/pg-core';

export const palettes = pgTable('palettes', {
  palette_id: integer('palette_id').notNull().unique().primaryKey()
});

export const artworks = pgTable('artworks', {
  artwork_id: integer('artwork_id').notNull().unique().primaryKey(),
  file_path: text('file_path').notNull().unique()
});

export const onlineArtistArtworks = pgTable('online_artist_artworks', {
  online_artist_artwork_id: integer('online_artist_artwork_id').notNull().unique().primaryKey(),
  small_artwork_path: text('small_artwork_path').notNull(),
  medium_artwork_path: text('medium_artwork_path').notNull(),
  large_artwork_path: text('large_artwork_path')
});

export const albums = pgTable('albums', {
  album_id: integer('album_id').notNull().unique().primaryKey(),
  title: text('title').notNull(),
  year: integer('year'),
  artwork_id: integer('artwork_id').references(() => artworks.artwork_id)
});

export const songs = pgTable('songs', {
  song_id: integer('song_id').notNull().unique().primaryKey(),
  title: text('title').notNull(),
  duration: doublePrecision('duration').notNull().default(0),
  path: text('path').notNull().unique(),
  sample_rate: integer('sample_rate'),
  bit_rate: integer('bit_rate'),
  no_of_channels: integer('no_of_channels'),
  file_created_at: timestamp('file_created_at').notNull(),
  file_modified_at: timestamp('file_modified_at').notNull(),
  artwork_id: integer('artwork_id').references(() => artworks.artwork_id),
  album_id: integer('album_id').references(() => albums.album_id),
  palette_id: integer('palette_id')
    .notNull()
    .references(() => palettes.palette_id),
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull(),
  deleted_at: timestamp('deleted_at'),
  year: integer('year'),
  disk_number: integer('disk_number'),
  track_number: integer('track_number')
});

export const artists = pgTable('artists', {
  artist_id: integer('artist_id').notNull().unique().primaryKey(),
  name: text('name').notNull().unique(),
  artwork_id: integer('artwork_id').references(() => artworks.artwork_id),
  online_artist_artwork_id: integer('online_artist_artwork_id').references(
    () => onlineArtistArtworks.online_artist_artwork_id
  )
});

export const genres = pgTable('genres', {
  genre_id: integer('genre_id').notNull().unique().primaryKey(),
  name: text('name').notNull().unique(),
  artwork_id: integer('artwork_id').references(() => artworks.artwork_id),
  palette_id: integer('palette_id').references(() => palettes.palette_id)
});

export const playlists = pgTable('playlists', {
  playlist_id: integer('playlist_id').notNull().unique().primaryKey(),
  name: text('name').notNull().unique(),
  artwork_id: integer('artwork_id').references(() => artworks.artwork_id),
  created_at: timestamp('created_at').notNull().defaultNow()
});

export const listeningData = pgTable('listening_data', {
  listening_data_id: integer('listening_data_id').notNull().unique().primaryKey(),
  skip_count: integer('skip_count').notNull().default(0),
  full_listens_count: integer('full_listens_count').notNull().default(0),
  added_playlist_count: integer('added_playlist_count').notNull().default(0),
  song_id: integer('song_id')
    .notNull()
    .references(() => songs.song_id)
});

export const songBlacklist = pgTable('song_blacklist', {
  song_blacklist_id: integer('song_blacklist_id').notNull().unique().primaryKey(),
  song_id: integer('song_id')
    .notNull()
    .unique()
    .references(() => songs.song_id)
});

export const userData = pgTable('user_data', {
  id: integer('id').notNull().unique().primaryKey()
});

export const artistsSongs = pgTable(
  'artists_songs',
  {
    song_id: integer('song_id')
      .notNull()
      .references(() => songs.song_id),
    artist_id: integer('artist_id')
      .notNull()
      .references(() => artists.artist_id)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.song_id, table.artist_id] })
    };
  }
);

export const genresSongs = pgTable(
  'genres_songs',
  {
    song_id: integer('song_id')
      .notNull()
      .references(() => songs.song_id),
    genre_id: integer('genre_id')
      .notNull()
      .references(() => genres.genre_id)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.song_id, table.genre_id] })
    };
  }
);

export const albumsArtistsSongs = pgTable(
  'albums_artists_songs',
  {
    album_id: integer('album_id')
      .notNull()
      .references(() => albums.album_id),
    song_id: integer('song_id')
      .notNull()
      .references(() => songs.song_id),
    artist_id: integer('artist_id')
      .notNull()
      .references(() => artists.artist_id)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.album_id, table.song_id, table.artist_id] })
    };
  }
);

export const albumsArtists = pgTable(
  'albums_artists',
  {
    album_id: integer('album_id')
      .notNull()
      .references(() => albums.album_id),
    artist_id: integer('artist_id')
      .notNull()
      .references(() => artists.artist_id)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.album_id, table.artist_id] })
    };
  }
);

export const swatchTypes = pgTable('swatch_types', {
  swatch_type_id: integer('swatch_type_id').notNull().unique().primaryKey(),
  name: text('name').notNull().unique()
});

export const paletteSwatches = pgTable('palette_swatches', {
  palette_swatch_id: integer('palette_swatch_id').notNull().unique().primaryKey(),
  population: integer('population').notNull(),
  hex: text('hex').notNull(),
  hsl: text('hsl').notNull(),
  swatch_type_id: integer('swatch_type_id')
    .notNull()
    .references(() => swatchTypes.swatch_type_id),
  palette_id: integer('palette_id')
    .notNull()
    .references(() => palettes.palette_id)
});

export const songSeeks = pgTable('song_seeks', {
  song_seek_id: integer('song_seek_id').notNull().unique().primaryKey(),
  position: doublePrecision('position').notNull(),
  seek_count: integer('seek_count').notNull(),
  listening_data_id: integer('listening_data_id')
    .notNull()
    .references(() => listeningData.listening_data_id)
});

export const yearlyListens = pgTable('yearly_listens', {
  yearly_listen_id: integer('yearly_listen_id').notNull().unique().primaryKey(),
  year: integer('year').notNull(),
  listening_data_id: integer('listening_data_id')
    .notNull()
    .references(() => listeningData.listening_data_id)
});

export const songListens = pgTable('song_listens', {
  song_listen_id: integer('song_listen_id').notNull().unique().primaryKey(),
  listen_count: integer('listen_count').notNull().default(0),
  listened_at: timestamp('listened_at').notNull().defaultNow(),
  yearly_listen_id: integer('yearly_listen_id')
    .notNull()
    .references(() => yearlyListens.yearly_listen_id)
});

export const playlistsSongs = pgTable(
  'playlists_songs',
  {
    playlist_id: integer('playlist_id')
      .notNull()
      .references(() => playlists.playlist_id),
    song_id: integer('song_id')
      .notNull()
      .references(() => songs.song_id)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.playlist_id, table.song_id] })
    };
  }
);

export const folderBlacklist = pgTable('folder_blacklist', {
  folder_blacklist_id: integer('folder_blacklist_id').notNull().unique().primaryKey(),
  folder_path: text('folder_path').notNull().unique()
});


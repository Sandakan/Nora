import {
  pgTable,
  pgEnum,
  varchar,
  integer,
  timestamp,
  decimal,
  text,
  primaryKey,
  index,
  type AnyPgColumn,
  json,
  boolean
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================
export const artworkSourceEnum = pgEnum('artwork_source', ['LOCAL', 'REMOTE']);
export const swatchTypeEnum = pgEnum('swatch_type', [
  'VIBRANT',
  'LIGHT_VIBRANT',
  'DARK_VIBRANT',
  'MUTED',
  'LIGHT_MUTED',
  'DARK_MUTED'
]);

// ============================================================================
// Tables
// ============================================================================
export const artists = pgTable(
  'artists',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 1024 }).notNull(),
    isFavorite: boolean('is_favorite').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for name-based lookups and sorting (aToZ, zToA)
    index('idx_artists_name').on(t.name),
    index('idx_artists_is_favorite').on(t.isFavorite)
  ]
);

export const musicFolders = pgTable(
  'music_folders',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    path: text('path').notNull().unique(),
    name: varchar('name', { length: 512 }).notNull(),
    parentId: integer('parent_id').references((): AnyPgColumn => musicFolders.id),
    /*   When the folder itself was created on the file system */
    folderCreatedAt: timestamp('folder_created_at', { withTimezone: false }),
    /*   When the folder metadata (like permissions or timestamps) last changed */
    lastModifiedAt: timestamp('last_modified_at', { withTimezone: false }),
    /*   When file contents inside the folder were changed (more volatile) */
    lastChangedAt: timestamp('last_changed_at', { withTimezone: false }),
    /*   When your app last parsed or indexed the contents of this folder */
    lastParsedAt: timestamp('last_parsed_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Existing index for hierarchical queries
    index('idx_parent_id').on(t.parentId),
    // Index for path-based lookups
    index('idx_music_folders_path').on(t.path),
    // Composite index for hierarchical queries with path
    index('idx_music_folders_parent_path').on(t.parentId, t.path)
  ]
);

export const songs = pgTable(
  'songs',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    title: varchar('title', { length: 4096 }).notNull(),
    duration: decimal('duration', { precision: 10, scale: 3 }).notNull(),
    path: text('path').notNull().unique(),
    isFavorite: boolean('is_favorite').notNull().default(false),
    sampleRate: integer('sample_rate'),
    bitRate: integer('bit_rate'),
    noOfChannels: integer('no_of_channels'),
    year: integer('year'),
    diskNumber: integer('disk_number'),
    trackNumber: integer('track_number'),
    folderId: integer('folder_id').references(() => musicFolders.id),
    fileCreatedAt: timestamp('file_created_at', { withTimezone: false }).notNull(),
    fileModifiedAt: timestamp('file_modified_at', { withTimezone: false }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
  },
  (t) => [
    // Single column indexes for common sort operations
    index('idx_songs_title').on(t.title),
    index('idx_songs_year').on(t.year),
    index('idx_songs_track_number').on(t.trackNumber),
    index('idx_songs_created_at').on(t.createdAt),
    index('idx_songs_file_modified_at').on(t.fileModifiedAt),
    index('idx_songs_folder_id').on(t.folderId),
    index('idx_songs_path').on(t.path),

    // Composite indexes for common sorting patterns
    index('idx_songs_year_title').on(t.year, t.title),
    index('idx_songs_track_title').on(t.trackNumber, t.title),
    index('idx_songs_created_title').on(t.createdAt, t.title),
    index('idx_songs_modified_title').on(t.fileModifiedAt, t.title),

    // Index for folder-based queries
    index('idx_songs_folder_title').on(t.folderId, t.title),

    // Index for text search on title (case-insensitive)
    index('idx_songs_title_text')
      .on(t.title)
      .where(sql`${t.title} IS NOT NULL`)
  ]
);

export const artworks = pgTable(
  'artworks',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    path: text('path').notNull(),
    source: artworkSourceEnum('source').notNull().default('LOCAL'),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for path-based lookups
    index('idx_artworks_path').on(t.path),
    // Index for source filtering
    index('idx_artworks_source').on(t.source),
    // Index for dimension-based queries
    index('idx_artworks_dimensions').on(t.width, t.height)
  ]
);

export const palettes = pgTable(
  'palettes',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for artwork-based palette lookups
    index('idx_palettes_artwork_id').on(t.artworkId)
  ]
);

export const paletteSwatches = pgTable(
  'palette_swatches',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    population: integer('population').notNull(),
    hex: varchar('hex', { length: 255 }).notNull(),
    hsl: json('hsl').$type<{ h: number; s: number; l: number }>().notNull(),
    swatchType: swatchTypeEnum('swatch_type').notNull().default('VIBRANT'),
    paletteId: integer('palette_id')
      .notNull()
      .references(() => palettes.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for palette-based swatch lookups
    index('idx_palette_swatches_palette_id').on(t.paletteId),
    // Index for swatch type filtering
    index('idx_palette_swatches_type').on(t.swatchType),
    // Composite index for palette + type queries
    index('idx_palette_swatches_palette_type').on(t.paletteId, t.swatchType),
    // Index for hex color lookups
    index('idx_palette_swatches_hex').on(t.hex)
  ]
);

export const albums = pgTable(
  'albums',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    title: varchar('title', { length: 255 }).notNull(),
    year: integer('year'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for title-based lookups and sorting
    index('idx_albums_title').on(t.title),
    // Index for year-based filtering and sorting
    index('idx_albums_year').on(t.year),
    // Composite index for year + title sorting
    index('idx_albums_year_title').on(t.year, t.title)
  ]
);

export const genres = pgTable(
  'genres',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for name-based lookups and sorting
    index('idx_genres_name').on(t.name)
  ]
);

export const playlists = pgTable(
  'playlists',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for name-based lookups and sorting
    index('idx_playlists_name').on(t.name),
    // Index for creation date sorting
    index('idx_playlists_created_at').on(t.createdAt)
  ]
);

export const playEvents = pgTable(
  'play_events',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    playbackPercentage: decimal('playback_percentage', { precision: 5, scale: 1 }).notNull(),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based event lookups
    index('idx_play_events_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_play_events_created_at').on(t.createdAt),
    // Composite index for song + time queries (for play statistics)
    index('idx_play_events_song_created').on(t.songId, t.createdAt),
    // Index for playback percentage analysis
    index('idx_play_events_percentage').on(t.playbackPercentage)
  ]
);

export const seekEvents = pgTable(
  'seek_events',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    position: decimal('position', { precision: 8, scale: 3 }).notNull(),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based event lookups
    index('idx_seek_events_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_seek_events_created_at').on(t.createdAt),
    // Composite index for song + time queries
    index('idx_seek_events_song_created').on(t.songId, t.createdAt)
  ]
);

export const skipEvents = pgTable(
  'skip_events',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    position: decimal('position', { precision: 8, scale: 3 }).notNull(),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based event lookups
    index('idx_skip_events_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_skip_events_created_at').on(t.createdAt),
    // Composite index for song + time queries
    index('idx_skip_events_song_created').on(t.songId, t.createdAt)
  ]
);

export const songBlacklist = pgTable(
  'song_blacklist',
  {
    songId: integer('song_id')
      .primaryKey()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for blacklist lookups (though primary key already covers this)
    // Adding for consistency and potential composite queries
    index('idx_song_blacklist_created_at').on(t.createdAt)
  ]
);

export const folderBlacklist = pgTable(
  'folder_blacklist',
  {
    folderId: integer('folder_id')
      .primaryKey()
      .references(() => musicFolders.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for blacklist creation time queries
    index('idx_folder_blacklist_created_at').on(t.createdAt)
  ]
);

export const playHistory = pgTable(
  'play_history',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based lookups
    index('idx_play_history_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_play_history_created_at').on(t.createdAt)
  ]
);

// ============================================================================
// Many-to-Many Junction Tables
// ============================================================================
export const artworksSongs = pgTable(
  'artworks_songs',
  {
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.artworkId] }),
    // Indexes for reverse lookups
    index('idx_artworks_songs_artwork_id').on(table.artworkId),
    index('idx_artworks_songs_song_id').on(table.songId)
  ]
);

export const artistsArtworks = pgTable(
  'artists_artworks',
  {
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.artistId, table.artworkId] }),
    // Indexes for reverse lookups
    index('idx_artists_artworks_artwork_id').on(table.artworkId),
    index('idx_artists_artworks_artist_id').on(table.artistId)
  ]
);

export const albumsArtworks = pgTable(
  'albums_artworks',
  {
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.artworkId] }),
    // Indexes for reverse lookups
    index('idx_albums_artworks_artwork_id').on(table.artworkId),
    index('idx_albums_artworks_album_id').on(table.albumId)
  ]
);

export const artistsSongs = pgTable(
  'artists_songs',
  {
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.artistId] }),
    // Indexes for reverse lookups - crucial for artist-based queries
    index('idx_artists_songs_artist_id').on(table.artistId),
    index('idx_artists_songs_song_id').on(table.songId)
  ]
);

export const albumsSongs = pgTable(
  'album_songs',
  {
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.songId] }),
    // Indexes for reverse lookups - crucial for album-based queries
    index('idx_album_songs_album_id').on(table.albumId),
    index('idx_album_songs_song_id').on(table.songId)
  ]
);

export const genresSongs = pgTable(
  'genres_songs',
  {
    genreId: integer('genre_id')
      .notNull()
      .references(() => genres.id),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.genreId, table.songId] }),
    // Indexes for reverse lookups
    index('idx_genres_songs_genre_id').on(table.genreId),
    index('idx_genres_songs_song_id').on(table.songId)
  ]
);

export const artworksGenres = pgTable(
  'artworks_genres',
  {
    genreId: integer('genre_id')
      .notNull()
      .references(() => genres.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.genreId, table.artworkId] }),
    // Indexes for reverse lookups
    index('idx_artworks_genres_genre_id').on(table.genreId),
    index('idx_artworks_genres_artwork_id').on(table.artworkId)
  ]
);

export const playlistsSongs = pgTable(
  'playlists_songs',
  {
    playlistId: integer('playlist_id')
      .notNull()
      .references(() => playlists.id),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.playlistId, table.songId] }),
    // Indexes for reverse lookups - crucial for playlist operations
    index('idx_playlists_songs_playlist_id').on(table.playlistId),
    index('idx_playlists_songs_song_id').on(table.songId)
  ]
);

export const artworksPlaylists = pgTable(
  'artworks_playlists',
  {
    playlistId: integer('playlist_id')
      .notNull()
      .references(() => playlists.id),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.playlistId, table.artworkId] }),
    // Indexes for reverse lookups
    index('idx_artworks_playlists_playlist_id').on(table.playlistId),
    index('idx_artworks_playlists_artwork_id').on(table.artworkId)
  ]
);

export const albumsArtists = pgTable(
  'albums_artists',
  {
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id),
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.artistId] }),
    // Indexes for reverse lookups
    index('idx_albums_artists_album_id').on(table.albumId),
    index('idx_albums_artists_artist_id').on(table.artistId)
  ]
);

// ============================================================================
// Relations
// ============================================================================

// Main Table Relations
export const albumsRelations = relations(albums, ({ many }) => ({
  songs: many(albumsSongs),
  artists: many(albumsArtists),
  artworks: many(albumsArtworks)
}));

export const artistsRelations = relations(artists, ({ many }) => ({
  songs: many(artistsSongs),
  albums: many(albumsArtists),
  artworks: many(artistsArtworks)
}));

export const musicFoldersRelations = relations(musicFolders, ({ one, many }) => ({
  children: many(musicFolders, {
    relationName: 'music_folder_children'
  }),
  parent: one(musicFolders, {
    fields: [musicFolders.parentId],
    references: [musicFolders.id],
    relationName: 'music_folder_children'
  }),
  songs: many(songs)
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  folder: one(musicFolders, {
    fields: [songs.folderId],
    references: [musicFolders.id]
  }),
  artists: many(artistsSongs),
  albums: many(albumsSongs),
  genres: many(genresSongs),
  artworks: many(artworksSongs),
  playlists: many(playlistsSongs),
  blacklist: one(songBlacklist),
  playEvents: many(playEvents),
  seekEvents: many(seekEvents),
  skipEvents: many(skipEvents)
}));

export const artworksRelations = relations(artworks, ({ many, one }) => ({
  songs: many(artworksSongs),
  artists: many(artistsArtworks),
  albums: many(albumsArtworks),
  genres: many(artworksGenres),
  playlists: many(artworksPlaylists),
  palette: one(palettes)
}));

export const palettesRelations = relations(palettes, ({ one, many }) => ({
  artwork: one(artworks, {
    fields: [palettes.artworkId],
    references: [artworks.id]
  }),
  swatches: many(paletteSwatches)
}));

export const paletteSwatchesRelations = relations(paletteSwatches, ({ one }) => ({
  palette: one(palettes, {
    fields: [paletteSwatches.paletteId],
    references: [palettes.id]
  })
}));

export const genresRelations = relations(genres, ({ many }) => ({
  songs: many(genresSongs),
  artworks: many(artworksGenres)
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
  songs: many(playlistsSongs),
  artworks: many(artworksPlaylists)
}));

export const playEventsRelations = relations(playEvents, ({ one }) => ({
  song: one(songs, {
    fields: [playEvents.songId],
    references: [songs.id]
  })
}));

export const seekEventsRelations = relations(seekEvents, ({ one }) => ({
  song: one(songs, {
    fields: [seekEvents.songId],
    references: [songs.id]
  })
}));

export const skipEventsRelations = relations(skipEvents, ({ one }) => ({
  song: one(songs, {
    fields: [skipEvents.songId],
    references: [songs.id]
  })
}));

export const songBlacklistRelations = relations(songBlacklist, ({ one }) => ({
  song: one(songs, {
    fields: [songBlacklist.songId],
    references: [songs.id]
  })
}));

export const folderBlacklistRelations = relations(folderBlacklist, ({ one }) => ({
  folder: one(musicFolders, {
    fields: [folderBlacklist.folderId],
    references: [musicFolders.id]
  })
}));

// Junction Table Relations
export const artistsSongsRelations = relations(artistsSongs, ({ one }) => ({
  artist: one(artists, {
    fields: [artistsSongs.artistId],
    references: [artists.id]
  }),
  song: one(songs, {
    fields: [artistsSongs.songId],
    references: [songs.id]
  })
}));

export const albumsSongsRelations = relations(albumsSongs, ({ one }) => ({
  album: one(albums, {
    fields: [albumsSongs.albumId],
    references: [albums.id]
  }),
  song: one(songs, {
    fields: [albumsSongs.songId],
    references: [songs.id]
  })
}));

export const albumsArtistsRelations = relations(albumsArtists, ({ one }) => ({
  album: one(albums, {
    fields: [albumsArtists.albumId],
    references: [albums.id]
  }),
  artist: one(artists, {
    fields: [albumsArtists.artistId],
    references: [artists.id]
  })
}));

export const artworksSongsRelations = relations(artworksSongs, ({ one }) => ({
  artwork: one(artworks, {
    fields: [artworksSongs.artworkId],
    references: [artworks.id]
  }),
  song: one(songs, {
    fields: [artworksSongs.songId],
    references: [songs.id]
  })
}));

export const artistsArtworksRelations = relations(artistsArtworks, ({ one }) => ({
  artist: one(artists, {
    fields: [artistsArtworks.artistId],
    references: [artists.id]
  }),
  artwork: one(artworks, {
    fields: [artistsArtworks.artworkId],
    references: [artworks.id]
  })
}));

export const albumsArtworksRelations = relations(albumsArtworks, ({ one }) => ({
  album: one(albums, {
    fields: [albumsArtworks.albumId],
    references: [albums.id]
  }),
  artwork: one(artworks, {
    fields: [albumsArtworks.artworkId],
    references: [artworks.id]
  })
}));

export const genresSongsRelations = relations(genresSongs, ({ one }) => ({
  genre: one(genres, {
    fields: [genresSongs.genreId],
    references: [genres.id]
  }),
  song: one(songs, {
    fields: [genresSongs.songId],
    references: [songs.id]
  })
}));

export const artworksGenresRelations = relations(artworksGenres, ({ one }) => ({
  artwork: one(artworks, {
    fields: [artworksGenres.artworkId],
    references: [artworks.id]
  }),
  genre: one(genres, {
    fields: [artworksGenres.genreId],
    references: [genres.id]
  })
}));

export const playlistsSongsRelations = relations(playlistsSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistsSongs.playlistId],
    references: [playlists.id]
  }),
  song: one(songs, {
    fields: [playlistsSongs.songId],
    references: [songs.id]
  })
}));

export const artworksPlaylistsRelations = relations(artworksPlaylists, ({ one }) => ({
  artwork: one(artworks, {
    fields: [artworksPlaylists.artworkId],
    references: [artworks.id]
  }),
  playlist: one(playlists, {
    fields: [artworksPlaylists.playlistId],
    references: [playlists.id]
  })
}));

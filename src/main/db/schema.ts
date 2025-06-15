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
  type AnyPgColumn
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
export const artists = pgTable('artists', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 1024 }).notNull()
});

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
  (t) => [index('idx_parent_id').on(t.parentId)]
);

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
  folderId: integer('folder_id').references(() => musicFolders.id),
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
  songId: integer('song_id')
    .primaryKey()
    .references(() => songs.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

export const folderBlacklist = pgTable('folder_blacklist', {
  folderId: integer('folder_id')
    .primaryKey()
    .references(() => musicFolders.id),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull()
});

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

// ============================================================================
// Relations
// ============================================================================

// Main Table Relations
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


import { relations, type SQL, sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  customType,
  decimal,
  doublePrecision,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';

// ============================================================================
// Data types
// ============================================================================

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return `tsvector`;
  }
});

// Case-insensitive text type for fuzzy search support
export const citext = customType<{
  data: string;
}>({
  dataType() {
    return `citext`;
  }
});

// PostgreSQL cube type for multi-dimensional acoustic vector similarity
export const cube = customType<{
  data: string | number[];
  driverData: string;
}>({
  dataType() {
    return 'cube';
  },
  toDriver(value: string | number[]): string {
    if (Array.isArray(value)) {
      return `(${value.join(',')})`;
    }
    return value;
  },
  fromDriver(value: string): string {
    return value;
  }
});

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
    // Generated column: case-insensitive text for searches (using citext type)
    nameCI: citext('name_ci').generatedAlwaysAs((): SQL => sql`${artists.name}::citext`),
    mbid: varchar('mbid', { length: 64 }),
    isFavorite: boolean('is_favorite').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for name-based lookups and sorting (aToZ, zToA)
    index('idx_artists_name').on(t.name.asc()),
    // Index for case-insensitive exact matches
    index('idx_artists_name_ci').on(t.nameCI.asc()),
    // GIN index for fuzzy matching with pg_trgm trigram operator
    index('idx_artists_name_ci_trgm').using('gin', t.nameCI.op('gin_trgm_ops')),
    index('idx_artists_is_favorite').on(t.isFavorite),
    index('idx_artists_mbid').on(t.mbid)
  ]
);

export const musicFolders = pgTable(
  'music_folders',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    path: text('path').notNull().unique(),
    name: varchar('name', { length: 512 }).notNull(),
    isBlacklisted: boolean('is_blacklisted').notNull().default(false),
    parentId: integer('parent_id').references((): AnyPgColumn => musicFolders.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    isBlacklistedUpdatedAt: timestamp('is_blacklisted_updated_at', {
      withTimezone: false
    })
      .notNull()
      .defaultNow(),
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
    index('idx_music_folders_path').on(t.path.asc()),
    index('idx_music_folders_is_blacklisted').on(t.isBlacklisted),
    // Composite index for hierarchical queries with path
    index('idx_music_folders_parent_path').on(t.parentId, t.path.asc())
  ]
);

export const songs = pgTable(
  'songs',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    title: varchar('title', { length: 4096 }).notNull(),
    // Generated column: case-insensitive text for searches (using citext type)
    titleCI: citext('title_ci').generatedAlwaysAs((): SQL => sql`${songs.title}::citext`),
    duration: decimal('duration', { precision: 10, scale: 3 }).notNull(),
    skipCount: integer('skip_count').notNull().default(0),
    path: text('path').notNull().unique(),
    isFavorite: boolean('is_favorite').notNull().default(false),
    sampleRate: integer('sample_rate'),
    bitRate: integer('bit_rate'),
    noOfChannels: integer('no_of_channels'),
    year: integer('year'),
    diskNumber: integer('disk_number'),
    trackNumber: integer('track_number'),
    mbid: varchar('mbid', { length: 64 }),
    bpm: integer('bpm'),
    initialKey: varchar('initial_key', { length: 32 }),
    replayGainTrackGain: doublePrecision('replay_gain_track_gain'),
    replayGainTrackPeak: doublePrecision('replay_gain_track_peak'),
    grouping: varchar('grouping', { length: 512 }),
    publisher: varchar('publisher', { length: 512 }),
    isCompilation: boolean('is_compilation').notNull().default(false),
    bitsPerSample: integer('bits_per_sample'),
    isrc: varchar('isrc', { length: 64 }),
    folderId: integer('folder_id').references(() => musicFolders.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    isBlacklisted: boolean('is_blacklisted').notNull().default(false),
    isBlacklistedUpdatedAt: timestamp('is_blacklisted_updated_at', {
      withTimezone: false
    })
      .notNull()
      .defaultNow(),
    isFavoriteUpdatedAt: timestamp('is_favorite_updated_at', {
      withTimezone: false
    })
      .notNull()
      .defaultNow(),
    fileCreatedAt: timestamp('file_created_at', { withTimezone: false }).notNull(),
    fileModifiedAt: timestamp('file_modified_at', { withTimezone: false }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
  },
  (t) => [
    // Single column indexes for common sort operations
    index('idx_songs_title').on(t.title.asc()),
    // Index for case-insensitive exact matches
    index('idx_songs_title_ci').on(t.titleCI.asc()),
    // GIN index for fuzzy matching with pg_trgm trigram operator
    index('idx_songs_title_ci_trgm').using('gin', t.titleCI.op('gin_trgm_ops')),
    index('idx_songs_year').on(t.year.asc()),
    index('idx_songs_track_number').on(t.trackNumber.asc()),
    index('idx_songs_created_at').on(t.createdAt.desc()),
    index('idx_songs_file_modified_at').on(t.fileModifiedAt.desc()),
    index('idx_songs_folder_id').on(t.folderId),
    index('idx_songs_path').on(t.path),
    index('idx_songs_is_favorite').on(t.isFavorite),
    index('idx_songs_is_blacklisted').on(t.isBlacklisted),
    index('idx_songs_mbid').on(t.mbid),

    // Composite indexes for common sorting patterns
    index('idx_songs_skip_count_title').on(t.skipCount.desc(), t.title.asc()),
    index('idx_songs_year_title').on(t.year.asc(), t.title.asc()),
    index('idx_songs_track_title').on(t.trackNumber.asc(), t.title.asc()),
    index('idx_songs_created_title').on(t.createdAt.desc(), t.title.asc()),
    index('idx_songs_modified_title').on(t.fileModifiedAt.desc(), t.title.asc()),
    index('idx_songs_favorite_title').on(t.isFavorite, t.title.asc()),

    // Index for folder-based queries
    index('idx_songs_folder_title').on(t.folderId, t.title.asc())
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
    index('idx_artworks_dimensions').on(t.width, t.height),
    // Composite index for palette queries filtering by source and dimensions
    index('idx_artworks_source_dimensions').on(t.source, t.width, t.height)
  ]
);

export const palettes = pgTable(
  'palettes',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
      .references(() => palettes.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
    // Generated column: case-insensitive text for searches (using citext type)
    titleCI: citext('title_ci').generatedAlwaysAs((): SQL => sql`${albums.title}::citext`),
    mbid: varchar('mbid', { length: 64 }),
    year: integer('year'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for title-based lookups and sorting
    index('idx_albums_title').on(t.title.asc()),
    // Index for case-insensitive exact matches
    index('idx_albums_title_ci').on(t.titleCI.asc()),
    // GIN index for fuzzy matching with pg_trgm trigram operator
    index('idx_albums_title_ci_trgm').using('gin', t.titleCI.op('gin_trgm_ops')),
    // Index for year-based filtering and sorting
    index('idx_albums_year').on(t.year.desc()),
    // Composite index for year + title sorting
    index('idx_albums_year_title').on(t.year.desc(), t.title.asc()),
    index('idx_albums_mbid').on(t.mbid)
  ]
);

export const genres = pgTable(
  'genres',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull(),
    // Generated column: case-insensitive text for searches (using citext type)
    nameCI: citext('name_ci').generatedAlwaysAs((): SQL => sql`${genres.name}::citext`),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for name-based lookups and sorting
    index('idx_genres_name').on(t.name.asc()),
    // Index for case-insensitive exact matches
    index('idx_genres_name_ci').on(t.nameCI.asc()),
    // GIN index for fuzzy matching with pg_trgm trigram operator
    index('idx_genres_name_ci_trgm').using('gin', t.nameCI.op('gin_trgm_ops'))
  ]
);

export const playlists = pgTable(
  'playlists',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull(),
    // Generated column: case-insensitive text for searches (using citext type)
    nameCI: citext('name_ci').generatedAlwaysAs((): SQL => sql`${playlists.name}::citext`),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for name-based lookups and sorting
    index('idx_playlists_name').on(t.name.asc()),
    // Index for case-insensitive exact matches
    index('idx_playlists_name_ci').on(t.nameCI.asc()),
    // GIN index for fuzzy matching with pg_trgm trigram operator
    index('idx_playlists_name_ci_trgm').using('gin', t.nameCI.op('gin_trgm_ops')),
    // Index for creation date sorting
    index('idx_playlists_created_at').on(t.createdAt.desc())
  ]
);

export const playEvents = pgTable(
  'play_events',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    playbackPercentage: decimal('playback_percentage', {
      precision: 5,
      scale: 3
    }).notNull(),
    chosenByUser: boolean('chosen_by_user').notNull().default(false),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based event lookups
    index('idx_play_events_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_play_events_created_at').on(t.createdAt.desc()),
    // Composite index for song + time queries (for play statistics)
    index('idx_play_events_song_created').on(t.songId, t.createdAt.desc()),
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
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based event lookups
    index('idx_seek_events_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_seek_events_created_at').on(t.createdAt.desc()),
    // Composite index for song + time queries
    index('idx_seek_events_song_created').on(t.songId, t.createdAt.desc())
  ]
);

export const skipEvents = pgTable(
  'skip_events',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    position: decimal('position', { precision: 8, scale: 3 }).notNull(),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based event lookups
    index('idx_skip_events_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_skip_events_created_at').on(t.createdAt.desc()),
    // Composite index for song + time queries
    index('idx_skip_events_song_created').on(t.songId, t.createdAt.desc())
  ]
);

export const playHistory = pgTable(
  'play_history',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for song-based lookups
    index('idx_play_history_song_id').on(t.songId),
    // Index for time-based queries
    index('idx_play_history_created_at').on(t.createdAt.desc())
  ]
);

export const userSettings = pgTable(
  'user_settings',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

    // Language settings
    language: varchar('language', { length: 10 }).notNull().default('en'),

    // Theme settings (from AppThemeData)
    isDarkMode: boolean('is_dark_mode').notNull().default(true),
    useSystemTheme: boolean('use_system_theme').notNull().default(true),

    // Preferences
    autoLaunchApp: boolean('auto_launch_app').notNull().default(false),
    openWindowMaximizedOnStart: boolean('open_window_maximized_on_start').notNull().default(false),
    openWindowAsHiddenOnSystemStart: boolean('open_window_as_hidden_on_system_start')
      .notNull()
      .default(false),
    isMiniPlayerAlwaysOnTop: boolean('is_mini_player_always_on_top').notNull().default(false),
    isMusixmatchLyricsEnabled: boolean('is_musixmatch_lyrics_enabled').notNull().default(true),
    hideWindowOnClose: boolean('hide_window_on_close').notNull().default(false),
    traySingleClickTogglesWindow: boolean('tray_single_click_toggles_window')
      .notNull()
      .default(false),
    sendSongScrobblingDataToLastFM: boolean('send_song_scrobbling_data_to_lastfm')
      .notNull()
      .default(false),
    sendSongFavoritesDataToLastFM: boolean('send_song_favorites_data_to_lastfm')
      .notNull()
      .default(false),
    sendNowPlayingSongDataToLastFM: boolean('send_now_playing_song_data_to_lastfm')
      .notNull()
      .default(false),
    saveLyricsInLrcFilesForSupportedSongs: boolean('save_lyrics_in_lrc_files_for_supported_songs')
      .notNull()
      .default(true),
    enableDiscordRPC: boolean('enable_discord_rpc').notNull().default(true),
    saveVerboseLogs: boolean('save_verbose_logs').notNull().default(false),
    enableSmartAutoPlay: boolean('enable_smart_auto_play').notNull().default(false),

    // Window positions (stored as JSON objects)
    mainWindowX: integer('main_window_x'),
    mainWindowY: integer('main_window_y'),
    miniPlayerX: integer('mini_player_x'),
    miniPlayerY: integer('mini_player_y'),

    // Window dimensions (stored as JSON objects)
    mainWindowWidth: integer('main_window_width'),
    mainWindowHeight: integer('main_window_height'),
    miniPlayerWidth: integer('mini_player_width'),
    miniPlayerHeight: integer('mini_player_height'),
    zoomFactor: doublePrecision('zoom_factor').notNull().default(0.8),

    // Window state
    windowState: varchar('window_state', { length: 20 }).notNull().default('normal'),

    // Recent searches (stored as JSON array)
    recentSearches: json('recent_searches').$type<string[]>().notNull().default([]),

    // Optional settings
    customLrcFilesSaveLocation: text('custom_lrc_files_save_location'),

    // LastFM session data
    lastFmSessionName: varchar('lastfm_session_name', { length: 255 }),
    lastFmSessionKey: text('lastfm_session_key'),

    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    // Index for language-based queries
    index('idx_user_settings_language').on(t.language),
    // Index for window state queries
    index('idx_user_settings_window_state').on(t.windowState)
  ]
);

// ============================================================================
// User Preferences Tables (Migrated from localStorage)
// ============================================================================
export const userKeyboardShortcuts = pgTable('user_keyboard_shortcuts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  shortcuts: json('shortcuts').$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
});

export const userEqualizerPreset = pgTable(
  'user_equalizer_preset',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    presetName: varchar('preset_name', { length: 255 }).notNull().default('Default'),
    frequencyBands: json('frequency_bands').$type<number[]>().notNull().default([]),
    isEnabled: boolean('is_enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [index('idx_user_equalizer_preset_created_at').on(t.createdAt.desc())]
);

export const ignoredArtists = pgTable(
  'ignored_artists',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    artistId: integer('artist_id')
      .notNull()
      .unique()
      .references(() => artists.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [index('idx_ignored_artists_artist_id').on(t.artistId)]
);

export const ignoredFeaturingArtists = pgTable(
  'ignored_featuring_artists',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    artistId: integer('artist_id')
      .notNull()
      .unique()
      .references(() => artists.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [index('idx_ignored_featuring_artists_artist_id').on(t.artistId)]
);

export const ignoredDuplicateMetadata = pgTable(
  'ignored_duplicate_metadata',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    duplicateGroupId: varchar('duplicate_group_id', { length: 255 }).notNull(),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    index('idx_ignored_duplicate_metadata_group').on(t.duplicateGroupId),
    index('idx_ignored_duplicate_metadata_song').on(t.songId)
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
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
      .references(() => artists.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
      .references(() => albums.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
      .references(() => albums.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
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
      .references(() => genres.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
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
      .references(() => genres.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
      .references(() => playlists.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
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
      .references(() => playlists.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    artworkId: integer('artwork_id')
      .notNull()
      .references(() => artworks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
      .references(() => albums.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
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
// AI Recommendation & Last.fm Cache Tables
// ============================================================================

export const songAudioFeatures = pgTable(
  'song_audio_features',
  {
    songId: integer('song_id')
      .primaryKey()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    rmsEnergy: doublePrecision('rms_energy'),
    crestFactor: doublePrecision('crest_factor'),
    zeroCrossingRate: doublePrecision('zero_crossing_rate'),
    spectralCentroid: doublePrecision('spectral_centroid'),
    lowEnergyRatio: doublePrecision('low_energy_ratio'),
    midEnergyRatio: doublePrecision('mid_energy_ratio'),
    highEnergyRatio: doublePrecision('high_energy_ratio'),
    estimatedBpm: doublePrecision('estimated_bpm'),
    pulseClarity: doublePrecision('pulse_clarity'),
    featureVector: cube('feature_vector'),
    globalListeners: integer('global_listeners'),
    globalPlaycount: integer('global_playcount'),
    lastfmSyncedAt: timestamp('lastfm_synced_at', { withTimezone: false }),
    featureVersion: integer('feature_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    index('idx_song_audio_features_lastfm_synced').on(t.lastfmSyncedAt),
    index('idx_song_audio_features_vector').using('gist', t.featureVector)
  ]
);

export const songSimilarities = pgTable(
  'song_similarities',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    sourceSongId: integer('source_song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    targetSongId: integer('target_song_id').references(() => songs.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade'
    }),
    targetTitle: varchar('target_title', { length: 4096 }).notNull(),
    targetTitleCI: citext('target_title_ci').generatedAlwaysAs(
      (): SQL => sql`${songSimilarities.targetTitle}::citext`
    ),
    targetArtist: varchar('target_artist', { length: 1024 }).notNull(),
    targetArtistCI: citext('target_artist_ci').generatedAlwaysAs(
      (): SQL => sql`${songSimilarities.targetArtist}::citext`
    ),
    targetMbid: varchar('target_mbid', { length: 64 }),
    targetUrl: text('target_url'),
    matchScore: doublePrecision('match_score').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    index('idx_song_similarities_source').on(t.sourceSongId),
    index('idx_song_similarities_target').on(t.targetSongId),
    index('idx_song_similarities_target_mbid').on(t.targetMbid),
    index('idx_song_similarities_target_title_ci').on(t.targetTitleCI),
    index('idx_song_similarities_match_score').on(t.matchScore.desc())
  ]
);

export const artistSimilarities = pgTable(
  'artist_similarities',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    sourceArtistId: integer('source_artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    targetArtistId: integer('target_artist_id').references(() => artists.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade'
    }),
    targetArtistName: varchar('target_artist_name', { length: 1024 }).notNull(),
    targetArtistNameCI: citext('target_artist_name_ci').generatedAlwaysAs(
      (): SQL => sql`${artistSimilarities.targetArtistName}::citext`
    ),
    targetMbid: varchar('target_mbid', { length: 64 }),
    targetUrl: text('target_url'),
    matchScore: doublePrecision('match_score').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    index('idx_artist_similarities_source').on(t.sourceArtistId),
    index('idx_artist_similarities_target').on(t.targetArtistId),
    index('idx_artist_similarities_target_mbid').on(t.targetMbid),
    index('idx_artist_similarities_target_name_ci').on(t.targetArtistNameCI),
    index('idx_artist_similarities_match_score').on(t.matchScore.desc())
  ]
);

export const lastfmTags = pgTable(
  'lastfm_tags',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    nameCI: citext('name_ci').generatedAlwaysAs((): SQL => sql`${lastfmTags.name}::citext`),
    url: text('url'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    index('idx_lastfm_tags_name_ci').on(t.nameCI)
  ]
);

export const songsLastfmTags = pgTable(
  'songs_lastfm_tags',
  {
    songId: integer('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => lastfmTags.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    weight: integer('weight').notNull().default(0)
  },
  (t) => [
    primaryKey({ columns: [t.songId, t.tagId] }),
    index('idx_songs_lastfm_tags_song_id').on(t.songId),
    index('idx_songs_lastfm_tags_tag_id').on(t.tagId)
  ]
);

export const artistsLastfmTags = pgTable(
  'artists_lastfm_tags',
  {
    artistId: integer('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => lastfmTags.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    weight: integer('weight').notNull().default(0)
  },
  (t) => [
    primaryKey({ columns: [t.artistId, t.tagId] }),
    index('idx_artists_lastfm_tags_artist_id').on(t.artistId),
    index('idx_artists_lastfm_tags_tag_id').on(t.tagId)
  ]
);

export const albumsLastfmTags = pgTable(
  'albums_lastfm_tags',
  {
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => lastfmTags.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    weight: integer('weight').notNull().default(0)
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.tagId] }),
    index('idx_albums_lastfm_tags_album_id').on(t.albumId),
    index('idx_albums_lastfm_tags_tag_id').on(t.tagId)
  ]
);

// ============================================================================
// Relations
// ============================================================================

// User Preferences Relations
export const userKeyboardShortcutsRelations = relations(userKeyboardShortcuts, () => ({}));

export const userEqualizerPresetRelations = relations(userEqualizerPreset, () => ({}));

export const ignoredArtistsRelations = relations(ignoredArtists, ({ one }) => ({
  artist: one(artists, {
    fields: [ignoredArtists.artistId],
    references: [artists.id]
  })
}));

export const ignoredFeaturingArtistsRelations = relations(ignoredFeaturingArtists, ({ one }) => ({
  artist: one(artists, {
    fields: [ignoredFeaturingArtists.artistId],
    references: [artists.id]
  })
}));

export const ignoredDuplicateMetadataRelations = relations(ignoredDuplicateMetadata, ({ one }) => ({
  song: one(songs, {
    fields: [ignoredDuplicateMetadata.songId],
    references: [songs.id]
  })
}));

// Main Table Relations
export const albumsRelations = relations(albums, ({ many }) => ({
  songs: many(albumsSongs),
  artists: many(albumsArtists),
  artworks: many(albumsArtworks),
  lastfmTags: many(albumsLastfmTags)
}));

export const artistsRelations = relations(artists, ({ many }) => ({
  songs: many(artistsSongs),
  albums: many(albumsArtists),
  artworks: many(artistsArtworks),
  similarities: many(artistSimilarities, { relationName: 'artist_similarities_source' }),
  lastfmTags: many(artistsLastfmTags)
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
  audioFeatures: one(songAudioFeatures),
  artists: many(artistsSongs),
  albums: many(albumsSongs),
  genres: many(genresSongs),
  artworks: many(artworksSongs),
  playlists: many(playlistsSongs),
  playHistory: many(playHistory),
  playEvents: many(playEvents),
  seekEvents: many(seekEvents),
  skipEvents: many(skipEvents),
  similarities: many(songSimilarities, { relationName: 'song_similarities_source' }),
  lastfmTags: many(songsLastfmTags)
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

export const playHistoryRelations = relations(playHistory, ({ one }) => ({
  song: one(songs, {
    fields: [playHistory.songId],
    references: [songs.id]
  })
}));

export const scrobbleQueue = pgTable(
  'scrobble_queue',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    songId: integer('song_id').references(() => songs.id, {
      onDelete: 'set null',
      onUpdate: 'cascade'
    }),
    startTimeSecs: integer('start_time_secs'),
    operationType: varchar('operation_type', { length: 20 }).notNull(),
    trackTitle: varchar('track_title', { length: 4096 }),
    artistNames: text('artist_names'),
    status: varchar('status', { length: 10 }).notNull().default('pending'),
    retryCount: integer('retry_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => [
    index('idx_scrobble_queue_status').on(t.status),
    index('idx_scrobble_queue_created_at').on(t.createdAt.asc())
  ]
);

export const scrobbleQueueRelations = relations(scrobbleQueue, ({ one }) => ({
  song: one(songs, {
    fields: [scrobbleQueue.songId],
    references: [songs.id]
  })
}));

// User settings has no relations as it's a single-row configuration table

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

export const songAudioFeaturesRelations = relations(songAudioFeatures, ({ one }) => ({
  song: one(songs, {
    fields: [songAudioFeatures.songId],
    references: [songs.id]
  })
}));

export const songSimilaritiesRelations = relations(songSimilarities, ({ one }) => ({
  sourceSong: one(songs, {
    fields: [songSimilarities.sourceSongId],
    references: [songs.id],
    relationName: 'song_similarities_source'
  }),
  targetSong: one(songs, {
    fields: [songSimilarities.targetSongId],
    references: [songs.id]
  })
}));

export const artistSimilaritiesRelations = relations(artistSimilarities, ({ one }) => ({
  sourceArtist: one(artists, {
    fields: [artistSimilarities.sourceArtistId],
    references: [artists.id],
    relationName: 'artist_similarities_source'
  }),
  targetArtist: one(artists, {
    fields: [artistSimilarities.targetArtistId],
    references: [artists.id]
  })
}));

export const lastfmTagsRelations = relations(lastfmTags, ({ many }) => ({
  songs: many(songsLastfmTags),
  artists: many(artistsLastfmTags),
  albums: many(albumsLastfmTags)
}));

export const songsLastfmTagsRelations = relations(songsLastfmTags, ({ one }) => ({
  song: one(songs, {
    fields: [songsLastfmTags.songId],
    references: [songs.id]
  }),
  tag: one(lastfmTags, {
    fields: [songsLastfmTags.tagId],
    references: [lastfmTags.id]
  })
}));

export const artistsLastfmTagsRelations = relations(artistsLastfmTags, ({ one }) => ({
  artist: one(artists, {
    fields: [artistsLastfmTags.artistId],
    references: [artists.id]
  }),
  tag: one(lastfmTags, {
    fields: [artistsLastfmTags.tagId],
    references: [lastfmTags.id]
  })
}));

export const albumsLastfmTagsRelations = relations(albumsLastfmTags, ({ one }) => ({
  album: one(albums, {
    fields: [albumsLastfmTags.albumId],
    references: [albums.id]
  }),
  tag: one(lastfmTags, {
    fields: [albumsLastfmTags.tagId],
    references: [lastfmTags.id]
  })
}));


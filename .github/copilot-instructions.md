# Nora - GitHub Copilot Instructions

> **AI Coding Agent Guidelines for Nora Music Player**  
> Generated to help AI agents understand architectural patterns, conventions, and development workflows.

---

## 🎯 Project Overview

**Nora** is an elegant, feature-rich music player built with Electron and React, inspired by Oto Music (Android). It emphasizes simplicity, beautiful design, and essential music management features that default music apps often lack.

### Core Technologies

- **Runtime**: Electron v39+ (main + renderer processes)
- **UI Framework**: React 19 with TypeScript (strict mode enabled)
- **Build System**: Vite + esbuild (electron-vite configuration)
- **State Management**: @tanstack/react-store with custom dispatch/store pattern
- **Data Fetching**: @tanstack/react-query with suspense queries
- **Routing**: TanStack Router
- **Database**: Drizzle ORM with PGlite (local PostgreSQL)
- **Styling**: Tailwind CSS v4 with dark mode support
- **Internationalization**: react-i18next
- **Testing**: Vitest with coverage reporting

### Key Features

- Organize songs, artists, albums, and playlists
- Synced and unsynced lyrics support
- Media Session API integration
- Discord Rich Presence integration
- Last.fm scrobbling support
- Custom metadata editing (MP3 only via node-id3)
- Dynamic theme generation from album artwork
- Mini-player mode with compact controls
- Global keyboard shortcuts

---

## 📁 Project Structure

```
nora/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Entry point: window management, IPC setup
│   │   ├── ipc.ts              # IPC handler registration
│   │   ├── db/                 # Database layer (Drizzle ORM + PGlite)
│   │   ├── core/               # Core business logic (library, playlists, etc.)
│   │   ├── fs/                 # File system watchers and operations
│   │   ├── auth/               # Last.fm authentication
│   │   └── other/              # Artworks, Discord RPC, utilities
│   │
│   ├── preload/                # Electron preload scripts
│   │   └── index.ts            # window.api bridge (IPC interface)
│   │
│   ├── renderer/               # React application
│   │   ├── src/
│   │   │   ├── App.tsx         # Main app component (365 lines, down from 2,013)
│   │   │   ├── hooks/          # 25+ custom React hooks for feature isolation
│   │   │   ├── store/          # TanStack Store configuration
│   │   │   ├── routes/         # TanStack Router routes
│   │   │   ├── components/     # React components
│   │   │   ├── other/          # Singleton services (AudioPlayer, PlayerQueue, etc.)
│   │   │   └── utils/          # Helper functions
│   │   └── index.html
│   │
│   ├── common/                 # Shared utilities (main + renderer)
│   │   ├── convert.ts
│   │   ├── isLyricsSynced.ts
│   │   ├── parseLyrics.ts
│   │   └── roundTo.ts
│   │
│   └── types/                  # TypeScript type definitions
│       ├── app.d.ts            # Core app types
│       └── [api].d.ts          # External API types
│
├── resources/                  # Static assets (icons, SQL migrations)
├── build/                      # Build artifacts and installer assets
└── test/                       # Vitest test files
```

---

## 🖥️ Main Process Architecture (Electron)

The main process is the heart of Nora's Electron application, handling system-level operations, database management, file system watching, and IPC communication.

### Main Process Entry Point (`src/main/main.ts`)

**Responsibilities**:
- Window lifecycle management (create, resize, position, state)
- Player type switching (normal, mini, full-screen)
- System integration (tray, taskbar, global shortcuts)
- App lifecycle events (startup, quit, before-quit cleanup)
- Power management (prevent sleep, battery detection)
- System theme watching
- Single instance lock enforcement
- Protocol handling (`nora://` custom protocol)
- Auto-launch configuration

**Key Variables** (module-level state):
```typescript
export let mainWindow: BrowserWindow;  // Main window instance
let tray: Tray;                         // System tray icon
let playerType: PlayerTypes;            // 'normal' | 'mini' | 'full'
let isAudioPlaying: boolean;            // Playback state for taskbar buttons
let currentSongPath: string;            // For lyrics/metadata persistence
let powerSaveBlockerId: number | null;  // Prevent display sleep during playback
```

**Window Size Constants**:
```typescript
// Normal window
MAIN_WINDOW_DEFAULT_SIZE_X = 1280
MAIN_WINDOW_DEFAULT_SIZE_Y = 720
MAIN_WINDOW_MIN_SIZE = 700x500

// Mini player
MINI_PLAYER_MIN_SIZE = 270x200
MINI_PLAYER_MAX_SIZE = 510x300
MINI_PLAYER_ASPECT_RATIO = 17/10
```

**Critical Functions**:
- `createWindow()`: Initialize BrowserWindow with preload script, frame settings, visual effects
- `manageWindowFinishLoad()`: Restore window position/size from settings, show window
- `handleBeforeQuit()`: Cleanup operations (save lyrics, metadata, close watchers, clear temp files)
- `changePlayerType(type)`: Switch between normal/mini/full-screen modes with size/position restoration
- `dataUpdateEvent(dataType, data, message)`: Debounced event aggregation for library updates

**System Integration**:
- **Single Instance**: Uses `app.requestSingleInstanceLock()` to prevent multiple instances
- **Custom Protocol**: Registers `nora://` for file associations and auth callbacks (Last.fm)
- **Tray Menu**: Show/hide app, exit option
- **Global Shortcuts**: F12 (devtools in development)
- **Power Monitor**: Detect AC/battery status, prevent display sleep during playback

### IPC Handler Registration (`src/main/ipc.ts`)

**Pattern**: Centralized IPC registration in `initializeIPC(mainWindow, abortSignal)` function.

**IPC Categories** (matches preload bridge):

1. **Window Controls** (`ipcMain.on`):
   - `app/close`, `app/minimize`, `app/toggleMaximize`, `app/hide`, `app/show`
   - Player type changes: `changePlayerType(type)`

2. **Audio Library** (`ipcMain.handle`):
   - `getSong`, `getAllSongs`, `getAllHistorySongs`, `getAllFavoriteSongs`
   - `getSongInfo`, `getSongListeningData`, `updateSongListeningData`
   - `addSongsFromFolderStructures`, `resyncSongsLibrary`

3. **Playlists** (`ipcMain.handle`):
   - `addNewPlaylist`, `removePlaylists`, `renameAPlaylist`
   - `addSongsToPlaylist`, `removeSongFromPlaylist`, `addArtworkToAPlaylist`
   - `exportPlaylist`, `importPlaylist`

4. **Metadata Management** (`ipcMain.handle`):
   - `getSongId3Tags`, `updateSongId3Tags`, `isMetadataUpdatesPending`
   - `reParseSong` (re-extract metadata from file)

5. **Lyrics** (`ipcMain.handle`):
   - `getSongLyrics`, `saveLyricsToSong`
   - `getTranslatedLyrics`, `romanizeLyrics`, `convertLyricsToPinyin`, `convertLyricsToRomaja`, `resetLyrics`

6. **Search & Filtering** (`ipcMain.handle`):
   - `search(filters, value, updateHistory, useSimilarity)`
   - `getArtistData`, `getGenresData`, `getAlbumData`, `getPlaylistData`

7. **External APIs** (`ipcMain.handle`):
   - Last.fm: `scrobbleSong`, `sendNowPlayingSongDataToLastFM`, `getSimilarTracksForASong`, `getAlbumInfoFromLastFM`
   - Metadata search: `searchSongMetadataResultsInInternet`, `fetchSongMetadataFromInternet`

8. **File System Operations** (`ipcMain.handle`):
   - `getFolderStructures`, `getFolderData`, `removeAMusicFolder`
   - `blacklistFolders`, `restoreBlacklistedFolders`, `toggleBlacklistedFolders`
   - `blacklistSongs`, `restoreBlacklistedSongs`
   - `deleteSongsFromSystem` (with abort signal for cancellation)

9. **System Dialogs** (`ipcMain.handle`):
   - `getImgFileLocation`, `getFolderLocation` (use `showOpenDialog`)

10. **Settings & User Data** (`ipcMain.handle`):
    - `getUserData`, `getUserSettings`, `saveUserSettings`
    - `getStorageUsage`, `getDatabaseMetrics`

11. **Theme & Visual** (`ipcMain.handle`):
    - `generatePalettes` (extract color palettes from artwork)
    - `getArtworksForMultipleArtworksCover` (for playlist covers)

12. **Event Listeners** (`ipcMain.on`):
    - `app/changeAppTheme`, `app/player/songPlaybackStateChange`
    - `app/setDiscordRpcActivity`, `app/networkStatusChange`
    - `app/stopScreenSleeping`, `app/allowScreenSleeping`
    - `app/resetApp`, `app/restartRenderer`, `app/restartApp`
    - `app/openLogFile`, `app/openInBrowser`, `app/openDevTools`

**Handler Pattern**:
```typescript
// Async operations (return data)
ipcMain.handle('app/getSong', (_, id: string) => sendAudioData(id));

// Fire-and-forget (no return)
ipcMain.on('app/player/songPlaybackStateChange', (_, isPlaying: boolean) => 
  toggleAudioPlayingState(isPlaying)
);

// With abort signal (cancellable long operations)
ipcMain.handle('app/deleteSongsFromSystem', (_, paths: string[], isPermanent: boolean) =>
  deleteSongsFromSystem(paths, abortSignal, isPermanent)
);
```

### Database Layer (`src/main/db/`)

**Technology**: Drizzle ORM with PGlite (local PostgreSQL in WASM)

**Structure**:
```
db/
├── db.ts              # Database initialization, migrations, seeding
├── schema.ts          # Drizzle table schemas
├── seed.ts            # Default data seeding
└── queries/           # Organized query modules
    ├── songs.ts       # Song CRUD operations
    ├── artists.ts     # Artist queries
    ├── albums.ts      # Album queries
    ├── playlists.ts   # Playlist management
    ├── genres.ts      # Genre operations
    ├── folders.ts     # Music folder tracking
    ├── history.ts     # Listening history
    ├── listens.ts     # Song play counts and stats
    ├── settings.ts    # User preferences
    ├── artworks.ts    # Artwork caching
    ├── palettes.ts    # Color palette storage
    ├── queue.ts       # Queue state persistence
    ├── search.ts      # Search history
    └── other.ts       # Database metrics, utilities
```

**Database Initialization** (`db.ts`):
```typescript
// PGlite with extensions
const pgliteInstance = await PGlite.create(DB_PATH, {
  extensions: { pg_trgm, citext }  // Full-text search, case-insensitive text
});

// Drizzle ORM instance
export const db = drizzle(pgliteInstance, { schema });

// Run migrations automatically on startup
await migrate(db, { migrationsFolder });
await seedDatabase();  // Insert default settings if needed

// Graceful shutdown
export const closeDatabaseInstance = async () => {
  await pgliteInstance.close();
};
```

**Query Pattern** (example from `songs.ts`):
```typescript
import { db } from '../db';
import { songs, artists } from '../schema';

export async function getSongById(id: number) {
  const [song] = await db.select().from(songs).where(eq(songs.id, id)).limit(1);
  return song;
}

export async function getAllSongs(sortType?: SongSortTypes, filterType?: SongFilterTypes) {
  let query = db.select().from(songs);
  
  if (filterType === 'favorites') {
    query = query.where(eq(songs.isFavorite, true));
  }
  
  if (sortType === 'aToZ') {
    query = query.orderBy(asc(songs.title));
  }
  
  return await query;
}
```

**Migrations**: SQL files in `resources/drizzle/` (managed by `drizzle-kit generate`)

### Core Business Logic (`src/main/core/`)

**Organization**: Each feature in its own file (50+ files).

**Key Modules**:

1. **Library Management**:
   - `addMusicFolder.ts`: Scan folder, parse songs, insert to DB
   - `checkForNewSongs.ts`: Periodic library sync
   - `checkForStartUpSongs.ts`: Load queue on app launch
   - `getAllSongs.ts`, `getSongInfo.ts`: Song retrieval with pagination

2. **Playlists**:
   - `addNewPlaylist.ts`, `removePlaylists.ts`, `renameAPlaylist.ts`
   - `addSongsToPlaylist.ts`, `removeSongFromPlaylist.ts`
   - `addArtworkToAPlaylist.ts`: Custom playlist covers
   - `exportPlaylist.ts`, `importPlaylist.ts`: M3U support

3. **Metadata**:
   - `sendSongId3Tags.ts`: Read tags via music-metadata
   - `updateSongId3Tags.ts` (main): Write tags via node-id3 (MP3 only)
   - `saveLyricsToSong.ts`: Embed lyrics in ID3 tags
   - `convertParsedLyricsToNodeID3Format.ts`: Format conversion

4. **Search & Discovery**:
   - `fetchArtistData.ts`, `fetchAlbumData.ts`, `getGenresInfo.ts`
   - `getArtistDuplicates.ts`, `resolveDuplicates.ts`: Duplicate detection/merging
   - `resolveSeparateArtists.ts`: Split combined artist entries
   - `resolveFeaturingArtists.ts`: Extract featuring artists from titles

5. **External APIs**:
   - `fetchSongInfoFromLastFM.ts`: Scrobbling, metadata enrichment
   - `getArtistInfoFromNet.ts`: Artist bio and images
   - `getSongLyrics.ts`: Fetch from multiple lyrics APIs

6. **User Data**:
   - `toggleLikeSongs.ts`, `toggleLikeArtists.ts`: Favorites management
   - `updateSongListeningData.ts`: Play counts, skip counts, last played
   - `getListeningData.ts`: Analytics data
   - `clearSongHistory.ts`: Privacy/cleanup

7. **File Operations**:
   - `deleteSongsFromSystem.ts`: Delete files (with abort support)
   - `blacklistSongs.ts`, `blacklistFolders.ts`: Exclusion filters
   - `saveArtworkToSystem.ts`: Export artwork as image

8. **Data Portability**:
   - `exportAppData.ts`, `importAppData.ts`: Full app backup/restore
   - `getStorageUsage.ts`: Disk usage stats

**Pattern** (typical core function):
```typescript
// src/main/core/toggleLikeSongs.ts
import { db } from '@main/db/db';
import { songs } from '@main/db/schema';
import { dataUpdateEvent } from '@main/main';
import logger from '@main/logger';

export default async function toggleLikeSongs(
  songIds: string[],
  isLikeSong?: boolean
) {
  try {
    const songIdsNum = songIds.map(Number);
    
    // Update database
    await db.update(songs)
      .set({ isFavorite: isLikeSong ?? true })
      .where(inArray(songs.id, songIdsNum));
    
    // Notify renderer of data change
    dataUpdateEvent('songs/favoriteStatus', songIds);
    
    logger.info(`Toggled like status for ${songIds.length} songs`, { songIds, isLikeSong });
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to toggle like songs', { songIds, error });
    throw error;
  }
}
```

### File System Watchers (`src/main/fs/`)

**Purpose**: Real-time library synchronization when files change.

**Key Files**:
- `addWatchersToFolders.ts`: Watch music folders for song additions/removals
- `addWatchersToParentFolders.ts`: Watch parent directories for folder renames
- `checkFolderForContentModifications.ts`: Detect new/deleted songs
- `checkForFolderModifications.ts`: Handle folder renames/moves
- `controlAbortControllers.ts`: Cancellation for long-running watchers
- `resolveFilePaths.ts`: Path normalization (handle `nora://` protocol)

**Watcher Pattern**:
```typescript
// Uses Node.js fs.watch() with recursive option
const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
  if (eventType === 'rename') {
    // Song added or deleted
    checkFolderForContentModifications(folderPath);
  }
});

// Cleanup on app quit
abortController.signal.addEventListener('abort', () => watcher.close());
```

**Debouncing**: Events are aggregated and sent to renderer after 1 second delay (via `dataUpdateEvent()` in main.ts).

### Other Services (`src/main/other/`)

1. **Artwork Management** (`artworks.ts`):
   - Extract embedded artwork from audio files
   - Cache artwork to temp directory
   - Generate artwork URLs (`nora://localfiles/...`)

2. **Discord Rich Presence** (`discordRPC.ts`):
   - Integration with Discord RPC library
   - Display currently playing song with artwork

3. **Color Palette Generation** (`generatePalette.ts`):
   - Extract dominant colors from artwork using `node-vibrant`
   - Used for dynamic themes in renderer

4. **Last.fm Integration** (`lastFm/`):
   - Scrobbling (`scrobbleSong.ts`)
   - Now playing updates (`sendNowPlayingSongDataToLastFM.ts`)
   - Similar tracks (`getSimilarTracks.ts`)
   - Album info (`getAlbumInfoFromLastFM.ts`)
   - Authentication (`../auth/manageLastFmAuth.ts`)

### Song Parsing (`src/main/parseSong/`)

**Purpose**: Extract metadata from audio files.

**Process**:
1. Read file with `music-metadata` library
2. Extract tags (title, artist, album, year, genre, etc.)
3. Extract embedded artwork
4. Generate song ID (hash of file path)
5. Store in database

**Supported Formats**: MP3, WAV, OGG, AAC, M4A, M4R, OPUS, FLAC (from `package.json`)

**Metadata Editing**: Only MP3 files support writing tags (via `node-id3` library).

### Logging (`src/main/logger.ts`)

**Library**: Winston logger with file and console transports.

**Log Levels**: error, warn, info, debug, verbose

**Log File Location**: `app.getPath('userData')/logs/app.log`

**Pattern**:
```typescript
import logger from '@main/logger';

logger.info('User added songs to playlist', { playlistId, songIds });
logger.error('Failed to fetch lyrics', { error, songId });
logger.debug('Database query executed', { query, duration });
```

### Main Process State Management

**Key Insight**: Unlike the renderer (which uses TanStack Store), the main process uses **module-level variables** for state:

```typescript
// main.ts
export let mainWindow: BrowserWindow;  // Exported for access in other modules
let playerType: PlayerTypes;            // Private module state
let currentSongPath: string;            // Persisted for cleanup operations
```

**State Persistence**: User settings stored in database via `saveUserSettings()` (not localStorage).

**State Synchronization**: Main process notifies renderer via:
- `mainWindow.webContents.send(channel, data)` for events
- `dataUpdateEvent()` for debounced library updates
- IPC responses for request/reply patterns

---

## 🏗️ Architecture Patterns

### 1. Custom Hook Architecture

**Philosophy**: App.tsx has been refactored from 2,013 lines to 365 lines (~82% reduction) by extracting logic into focused, reusable hooks.

**Hook Categories**:

- **Lifecycle Hooks**: `useAppLifecycle`, `useAppUpdates`
- **Player Hooks**: `useAudioPlayer`, `usePlayerControl`, `usePlayerQueue`, `usePlayerNavigation`
- **Queue Hooks**: `useQueueManagement`, `usePlayerQueue`
- **Settings Hooks**: `usePlaybackSettings`, `useDynamicTheme`
- **Integration Hooks**: `useMediaSession`, `useDiscordRpc`, `useListeningData`
- **UI Hooks**: `useContextMenu`, `useWindowManagement`, `usePromptMenu`, `useNotifications`
- **Utility Hooks**: `useKeyboardShortcuts`, `useNetworkConnectivity`, `useDataSync`, `useBooleanStateChange`

**Hook Patterns**:

```tsx
// ✅ GOOD: Module-level singleton for services accessed by intervals/timers
const player = new AudioPlayer();

export function useAudioPlayer() {
  useEffect(() => {
    const interval = setInterval(() => {
      // player is always the same instance, no stale closures
      if (!player.paused) dispatchCurrentSongTime();
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  return player; // Return instance directly (not wrapped in ref)
}

// ❌ BAD: Ref-based singletons with intervals lead to stale closure issues
export function useAudioPlayer() {
  const playerRef = useRef<AudioPlayer>();
  
  useEffect(() => {
    playerRef.current = new AudioPlayer(); // Ref assigned after effect creation
    
    const interval = setInterval(() => {
      // playerRef.current may be null/stale when closure was created
      if (!playerRef.current?.paused) dispatchCurrentSongTime();
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  return playerRef.current; // Timing issues: ref not ready yet
}
```

**Key Insight**: For singleton services (AudioPlayer, PlayerQueue) that are accessed by intervals, timers, or event handlers, use **module-level initialization** (before the hook function), NOT refs. Refs inside hooks with intervals can capture stale/null references due to closure timing.

### 2. State Management

**TanStack Store** (`src/renderer/src/store/store.ts`):

```typescript
import { Store } from '@tanstack/store';
import { reducer as appReducer, DEFAULT_REDUCER_DATA } from '../other/appReducer';
import storage from '../utils/localStorage';

export const store = new Store(DEFAULT_REDUCER_DATA);

export const dispatch = (options: AppReducerStateActions) => {
  store.setState((state) => {
    return appReducer(state, options);
  });
};

// Automatically sync state to localStorage
store.subscribe((state) => {
  storage.setLocalStorage(state.currentVal.localStorage);
});
```

**Pattern**:
- Centralized store with reducer pattern (similar to Redux)
- `dispatch()` for all state updates
- Automatic localStorage persistence via subscription
- Access state in components: `store.state` or hooks: `useStore(store, (state) => state.propertyName)`

**Common Dispatch Actions**:
```typescript
dispatch({ type: 'UPDATE_CURRENT_SONG_DATA', data: songData });
dispatch({ type: 'UPDATE_PLAYER_STATE', data: { isPlaying: true } });
dispatch({ type: 'UPDATE_QUEUE_DATA', data: queueData });
dispatch({ type: 'UPDATE_LOCAL_STORAGE', data: localStorage });
```

### 3. IPC Communication (Electron)

**Preload Bridge** (`src/preload/index.ts`):

Exposes `window.api` to renderer process with categorized namespaces:

```typescript
// Main categories
window.api.properties          // App properties (isInDevelopment, commandLineArgs)
window.api.windowControls      // Window management (minimize, maximize, close, etc.)
window.api.playerControls      // Playback control (play/pause, skip, like, etc.)
window.api.audioLibraryControls // Library operations (getSong, getAllSongs, etc.)
window.api.theme               // Theme management (changeAppTheme, listenForSystemThemeChanges)
window.api.dataUpdates         // Real-time library updates (onSongDataUpdates, etc.)
window.api.quitEvent           // App lifecycle (beforeQuitEvent, etc.)
window.api.folderData          // Folder operations (addMusicFolders, etc.)
window.api.playlistControls    // Playlist CRUD operations
window.api.lyricsData          // Lyrics fetching and management
window.api.settingsHelpers     // Settings utilities (networkStatusChange, etc.)
window.api.unknownSource       // External file associations
```

**Patterns**:

1. **Invoke (async)**: `await window.api.audioLibraryControls.getSong(songId)`
2. **Send (fire-and-forget)**: `window.api.playerControls.songPlaybackStateChange(true)`
3. **Event listeners (with cleanup)**:
   ```typescript
   useEffect(() => {
     const handleEvent = (e: unknown) => { /* handler */ };
     window.api.playerControls.toggleSongPlayback(handleEvent);
     
     return () => {
       window.api.playerControls.removeTogglePlaybackStateEvent(handleEvent);
     };
   }, [dependencies]);
   ```

**Main Process** (`src/main/ipc.ts`):
- Registers all IPC handlers using `ipcMain.handle()` (async) and `ipcMain.on()` (sync)
- Handlers call business logic in `src/main/core/` or `src/main/db/`

### 4. Event-Driven Architecture

**Custom Events**:

```typescript
// Player position updates (dispatched by useAudioPlayer every 100ms)
const playerPositionChange = new CustomEvent('player/positionChange', {
  detail: roundTo(player.currentTime || 0, 2)
});
document.dispatchEvent(playerPositionChange);

// Queue changes (dispatched by PlayerQueue class)
this.emit('queueChange', this.queue);
this.emit('positionChange', this.currentSongIndex);
```

**Pattern**: Use event emitters (PlayerQueue) and CustomEvents (document-level) for real-time updates without tight coupling.

### 5. Data Fetching with TanStack Query

**Query Keys Factory** (`@lukemorales/query-key-factory`):

```typescript
import { createQueryKeyStore } from '@lukemorales/query-key-factory';

export const settingsQuery = createQueryKeyStore({
  settings: {
    all: {
      queryKey: ['settings', 'all'],
      queryFn: () => window.api.settingsHelpers.getUserSettings()
    },
    theme: {
      queryKey: ['settings', 'theme'],
      queryFn: () => window.api.settingsHelpers.getUserSettings().then(s => s.theme)
    }
  }
});

// Usage in components
const { data: userSettings } = useSuspenseQuery(settingsQuery.all);
```

**Pattern**: Centralized query key management for type-safe, cacheable data fetching.

---

## 🎨 Styling and Theming

### Tailwind CSS v4

- Configuration: `tailwind.config.js`
- Plugin: `@tailwindcss/vite` integrated in `electron.vite.config.ts`
- Dark mode: Toggled via `document.body.classList.toggle('dark')` (managed in `useDynamicTheme` hook)

### Dynamic Theme System

**Pattern** (in `useDynamicTheme` hook):

1. Extract color palette from song artwork using `node-vibrant`
2. Apply colors to CSS variables or Tailwind classes
3. Support background images with blur/opacity overlays
4. Dark mode detection from settings: `userSettings.isDarkMode`

**Dark Mode Management**:
```typescript
// useDynamicTheme.tsx
useEffect(() => {
  const { data: userSettings } = useSuspenseQuery(settingsQuery.all);
  
  if (userSettings.isDarkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}, [userSettings.isDarkMode]);
```

---

## 🧪 Testing

### Vitest Configuration (`vitest.config.ts`)

- **Test Files**: `test/**/*.test.ts`
- **Coverage**: Collected in `coverage/` directory with v8 provider
- **Environment**: Node.js
- **Path Aliases**: Configured for `@renderer`, `@main`, `@common`, etc.

### Running Tests

```bash
npm test                    # Run all tests in watch mode
npm run coverage            # Run tests with coverage report
npm run check-types         # TypeScript type checking
npm run lint                # ESLint
npm run prettier-check      # Prettier formatting check
```

### Test Patterns

```typescript
// Example test structure
import { describe, test, expect } from 'vitest';
import { parseLyrics } from '@common/parseLyrics';

describe('parseLyrics', () => {
  test('should parse synced lyrics', () => {
    const input = '[00:12.00]Line 1\n[00:15.00]Line 2';
    const result = parseLyrics(input);
    expect(result.isSynced).toBe(true);
    expect(result.lyrics).toHaveLength(2);
  });
});
```

### Mocking Patterns

```typescript
// Mock with vi.fn() and vi.spyOn()
import { vi } from 'vitest';

// Module mocking
vi.mock('../../../src/main/logger', () => ({
  default: {
    info: vi.fn((...data) => console.log(...data)),
    error: vi.fn((...data) => console.error(...data)),
    warn: vi.fn((...data) => console.warn(...data))
  }
}));

// Spy on console methods
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
```

---

## 🔨 Development Workflows

### Build Commands

```bash
# Development
npm start                   # Preview production build
npm run dev                 # Hot-reload development mode

# Type Checking
npm run typecheck           # Check all TypeScript
npm run typecheck:node      # Check main process only
npm run typecheck:web       # Check renderer process only

# Building
npm run build               # Build all processes (main + preload + renderer)
npm run build:win           # Build Windows installer (x64 + arm64)
npm run build:win-x64       # Build Windows installer (x64 only)
npm run build:mac           # Build macOS installer
npm run build:linux         # Build Linux installer
npm run build:unpack        # Build without packaging (for testing)

# Database (Drizzle ORM)
npm run db:migrate          # Run pending migrations
npm run db:generate         # Generate migration files from schema
npm run db:push             # Push schema changes without migrations
npm run db:studio           # Open Drizzle Studio (database GUI)
npm run db:drop             # Drop database (custom script)

# Routing (TanStack Router)
npm run renderer:generate-routes   # Generate route tree
npm run renderer:watch-routes      # Watch and auto-generate routes
```

### Project-Specific npm Scripts

```bash
# Code Quality
npm run format              # Auto-fix formatting with Prettier
npm run lint-fix            # Auto-fix linting issues
npm run eslint-inspector    # Open ESLint config inspector

# Pre-commit
npm run husky-test          # Run before commits (Prettier + tests)
```

---

## 🚨 Common Pitfalls and Solutions

### 1. Stale Closures with Intervals

**Problem**: Using `useRef` for singletons accessed by intervals/timers leads to stale references.

**Solution**: Use module-level initialization (see Architecture Patterns > Custom Hook Architecture).

### 2. Event Listener Cleanup

**Problem**: Forgetting to remove IPC event listeners causes memory leaks.

**Solution**: Always return cleanup function in `useEffect`:

```tsx
useEffect(() => {
  const handler = (e: unknown) => { /* ... */ };
  window.api.playerControls.toggleSongPlayback(handler);
  
  return () => {
    window.api.playerControls.removeTogglePlaybackStateEvent(handler);
  };
}, [dependencies]);
```

### 3. localStorage Sync Timing

**Problem**: localStorage updates may not be immediately available after dispatch.

**Solution**: Store subscription in `store.ts` ensures automatic persistence. For immediate reads, use `storage.getLocalStorage()` directly.

### 4. Dark Mode Not Updating

**Problem**: Dark mode class not applied to `document.body`.

**Solution**: Ensure `useDynamicTheme` is called in App.tsx and uses `useSuspenseQuery(settingsQuery.all)` for reactive updates.

### 5. TanStack Router Migration (In Progress)

**Status**: Custom page navigation (`changeCurrentActivePage`, `updatePageHistoryIndex`) is deprecated but still present in App.tsx (~90 lines).

**Action Required**: Do not add new dependencies on these functions. Use TanStack Router's `<Link>`, `useNavigate()`, and `useRouter()` instead.

**Cleanup Planned**: These functions will be removed once all pages migrate to TanStack Router routes.

---

## 📝 Coding Conventions

### Naming Conventions

Follow the language-agnostic style guide in `coding_style_guide.instructions.md`:

- **Descriptive Names**: Use clear, context-rich names (avoid `data`, `user`, `info`, `temp`)
  - ✅ `authenticatedUser`, `songMetadata`, `playlistQueue`
  - ❌ `user`, `data`, `list`
  
- **Functions**: Start with verbs
  - ✅ `calculateDuration()`, `fetchSongData()`, `validatePlaylist()`
  - ❌ `duration()`, `song()`, `playlist()`
  
- **Constants**: `UPPERCASE_WITH_UNDERSCORES`
  - ✅ `MAX_QUEUE_SIZE`, `DEFAULT_VOLUME`

### Function Structure

- **Keep Functions Small**: Aim for <30-50 lines
- **Single Responsibility**: One clear purpose per function
- **Guard Clauses**: Use early returns to avoid deep nesting

```tsx
// ✅ GOOD: Guard clauses flatten logic
function playSong(songId: string) {
  if (!songId) {
    console.error('No song ID provided');
    return;
  }
  
  const song = await getSongById(songId);
  if (!song) {
    console.error('Song not found');
    return;
  }
  
  // Main logic here (flat, readable)
  player.loadSong(song);
  player.play();
}

// ❌ BAD: Nested conditionals
function playSong(songId: string) {
  if (songId) {
    getSongById(songId).then(song => {
      if (song) {
        player.loadSong(song);
        player.play();
      } else {
        console.error('Song not found');
      }
    });
  } else {
    console.error('No song ID provided');
  }
}
```

### Import Organization

Use `eslint-plugin-simple-import-sort` for automatic sorting:

```typescript
// 1. External dependencies
import { useEffect, useCallback } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

// 2. Internal path aliases
import { settingsQuery } from '@renderer/queries';
import storage from '@renderer/utils/localStorage';

// 3. Relative imports
import AudioPlayer from '../other/player';
```

---

## 🔍 Key Files Reference

### Critical Files (Always Check Before Changes)

**Renderer Process**:

| File | Purpose | Why Important |
|------|---------|---------------|
| `src/renderer/src/App.tsx` | Main app component | Central integration point for all hooks, currently ~365 lines (down from 2,013) |
| `src/renderer/src/store/store.ts` | Global state management | All state updates go through `dispatch()` |
| `src/renderer/src/hooks/useAppLifecycle.tsx` | App initialization | Event listener setup, lifecycle management (~355 lines) |
| `src/renderer/src/other/appReducer.tsx` | State reducer logic | Defines all state update actions |

**Main Process**:

| File | Purpose | Why Important |
|------|---------|---------------|
| `src/main/main.ts` | Electron entry point | Window initialization, app lifecycle, system integration (835 lines) |
| `src/main/ipc.ts` | IPC handler registration | Maps all IPC calls to main process logic, 100+ handlers |
| `src/main/db/db.ts` | Database initialization | PGlite setup, migrations, Drizzle ORM instance |
| `src/main/db/schema.ts` | Database schema | All table definitions (songs, artists, albums, playlists, etc.) |
| `src/main/db/queries/songs.ts` | Song CRUD operations | Most frequently used database queries |
| `src/main/db/queries/settings.ts` | User settings | Get/save app preferences (stored in DB, not localStorage) |
| `src/main/logger.ts` | Logging infrastructure | Winston logger configuration for debugging |

**IPC Bridge**:

| File | Purpose | Why Important |
|------|---------|---------------|
| `src/preload/index.ts` | IPC bridge | Defines entire `window.api` interface exposed to renderer (583 lines) |

**Configuration**:

| File | Purpose | Why Important |
|------|---------|---------------|
| `package.json` | Dependencies & scripts | Build commands, supported file extensions, npm scripts |
| `electron.vite.config.ts` | Build configuration | Main + preload + renderer process bundling |
| `drizzle.config.ts` | Database ORM config | Migration paths, schema location |

### Singleton Services (Module-Level)

| File | Service | Pattern |
|------|---------|---------|
| `src/renderer/src/other/player.ts` | `AudioPlayer` class | Module-level instance in `useAudioPlayer.tsx` |
| `src/renderer/src/other/playerQueue.ts` | `PlayerQueue` class | Ref-based in `usePlayerQueue.tsx` (initialized from localStorage) |

### Configuration Files

| File | Purpose |
|------|---------|
| `electron.vite.config.ts` | Build configuration (main + preload + renderer) |
| `tailwind.config.js` | Tailwind CSS customization |
| `tsconfig.json` / `tsconfig.*.json` | TypeScript compiler options (multiple configs for different processes) |
| `drizzle.config.ts` | Drizzle ORM database configuration |
| `vitest.config.ts` | Vitest testing configuration |
| `electron-builder.yml` | Electron installer configuration |
| `tsr.config.json` | TanStack Router configuration |

---

## 🚀 Next Steps for AI Agents

### When Starting a New Task

1. **Read `README.md`** for feature overview and user-facing functionality
2. **Check `changelog.md`** for recent changes and ongoing work
3. **Review `package.json`** for available scripts and supported file formats
4. **Scan `src/renderer/src/App.tsx`** to understand current hook integration
5. **Check `src/preload/index.ts`** for available IPC methods
6. **Read relevant hook files** in `src/renderer/src/hooks/` for feature-specific logic

### When Adding New Features

1. **Create a focused custom hook** (avoid adding logic directly to App.tsx)
2. **Follow module-level singleton pattern** for services with intervals/timers
3. **Add IPC methods** in `src/preload/index.ts` and `src/main/ipc.ts` if main process access is needed
4. **Update state via `dispatch()`** for UI updates
5. **Use TanStack Query** for data fetching (not custom fetch hooks)
6. **Add cleanup functions** for all event listeners

### When Refactoring

1. **Check `REFACTORING_APP_ANALYSIS.md`** (if exists) for ongoing refactoring plans
2. **Maintain single responsibility** for each hook/component
3. **Extract reusable logic** into utility functions in `src/renderer/src/utils/` or `src/common/`
4. **Test incrementally** after each change (use `npm test`)

### When Fixing Bugs

1. **Check `get_errors` tool output** for TypeScript/ESLint errors
2. **Review event listener cleanup** for memory leaks
3. **Verify localStorage sync** for state persistence issues
4. **Check IPC handler existence** in `src/main/ipc.ts` for "method not found" errors
5. **Validate hook dependencies** in `useEffect` arrays

---

## 📚 Additional Resources

- **Electron Docs**: https://www.electronjs.org/docs/latest
- **TanStack Store**: https://tanstack.com/store/latest
- **TanStack Query**: https://tanstack.com/query/latest
- **TanStack Router**: https://tanstack.com/router/latest
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs

---

## 🤝 Contributing

When making changes:

1. **Run type checks**: `npm run typecheck`
2. **Run tests**: `npm test`
3. **Format code**: `npm run format`
4. **Fix linting**: `npm run lint-fix`
5. **Test production build**: `npm run build:unpack` → `npm start`

**Pre-commit**: Husky runs `npm run husky-test` (Prettier check + tests).

---

## ✨ Current Status

**Refactoring Progress**: App.tsx reduced from 2,013 lines to 365 lines (81.9% reduction).

**Remaining Work**:
- Phase 5.1: Remove deprecated page navigation (~90 lines) - blocked on TanStack Router migration
- Phase 13: Final cleanup (~15-20 lines) - polish and remove commented code

**Target**: 250-270 lines (~87-88% total reduction) after TanStack Router migration completes.

---

_This document is maintained to help AI coding agents be immediately productive in the Nora codebase. Update as architectural patterns evolve._

---
name: tanstack-query-patterns
description: Guide for using TanStack Query patterns in the Nora project. Use when implementing data fetching, creating query modules, or consuming IPC data in React components.
applyTo: 'src/renderer/src/**/*.ts*'
---

# TanStack Query Pattern Guide for Nora

**Context**: Use this skill when adding new data fetching features, creating query modules, or consuming data from IPC in React components.

## Core Principles

1. **Centralized Query Keys**: All queries are defined in `src/renderer/src/queries/` using `@lukemorales/query-key-factory`
2. **IPC-Driven**: All data flows through `window.api.*` calls to the Electron main process
3. **Type-Safe**: Query keys and functions are strictly typed; cache invalidation keys match data scope
4. **Suspense Ready**: All queries support `useSuspenseQuery` for declarative data loading in routes

---

## File Organization

```
src/renderer/src/queries/
├── songs.ts           # songQuery: all(), allSongInfo(), singleSongInfo(), favorites(), history(), queue(), similarTracks()
├── aritsts.ts         # artistQuery: all(), single(), fetchOnlineInfo()
├── albums.ts          # albumQuery: all(), single()
├── playlists.ts       # playlistQuery: all(), single(), songArtworks()
├── genres.ts          # genreQuery: all(), single()
├── home.ts            # homeQuery: recentlyPlayedSongs(), recentSongArtists(), mostLovedSongs()
├── listens.ts         # listenQuery: single()
├── search.ts          # searchQuery: recentResults(), query()
├── lyrics.ts          # lyricsQuery (if needed)
├── settings.ts        # settingsQuery (with mutations)
├── queue.ts           # queueQuery
├── userPreferences.ts # userPreferencesQuery (with mutations)
└── other.ts           # otherQuery: databaseMetrics()
```

---

## Creating a Query Module

### Pattern: Simple Queries

For straightforward data fetches (e.g., all songs, artist info), create a single `queryKey` without parameters:

```typescript
// src/renderer/src/queries/home.ts
import { createQueryKeys } from '@lukemorales/query-key-factory';

export const homeQuery = createQueryKeys('home', {
  recentlyPlayedSongs: {
    queryKey: null, // No dynamic parameters
    queryFn: async (): Promise<SongData[]> => {
      try {
        const { data: playlists } = await window.api.playlistsData.getPlaylistData([
          SpecialPlaylists.History
        ]);
        const historyPlaylist = playlists[0];

        if (!historyPlaylist || historyPlaylist.songs.length === 0) return [];

        const songs = await window.api.audioLibraryControls.getSongInfo(
          historyPlaylist.songs,
          undefined,
          undefined,
          35,
          true
        );

        return Array.isArray(songs) ? songs : [];
      } catch (error) {
        console.error(error);
        return [];
      }
    }
  }
});
```

### Pattern: Parameterized Queries

For queries with dynamic parameters (filters, sorting, pagination), accept a `data` object and return both `queryKey` and `queryFn`:

```typescript
// src/renderer/src/queries/songs.ts
export const songQuery = createQueryKeys('songs', {
  all: (data: {
    sortType: SongSortTypes;
    filterType?: SongFilterTypes;
    start?: number;
    end?: number;
  }) => {
    const { sortType = 'addedOrder', filterType = 'notSelected', start = 0, end = 0 } = data;

    return {
      queryKey: [
        `sortType=${sortType}`,
        `filterType=${filterType}`,
        `start=${start}`,
        `end=${end}`,
        `limit=${end - start}`
      ],
      queryFn: () =>
        window.api.audioLibraryControls.getAllSongs(sortType, filterType, {
          start,
          end
        })
    };
  }
});
```

### Key Construction Rules

**✅ DO**:

- Use **template strings** for cache key components: `sortType=${sortType}`
- Stabilize arrays before joining in cache keys: `songIds=${[...songIds].sort().join(',')}`
- Include all parameters that affect query results
- Use semantic names in keys: `start`, `end`, `limit`, `sortType`, `filterType`

**❌ DON'T**:

- Include object references directly in keys
- Use cryptic abbreviations
- Mutate the input array when calculating the cache key (copy first)

---

## Using Queries in Components

### Pattern: Route Loader (Pre-fetching)

Ensure data is available before component renders:

```typescript
// src/renderer/src/routes/main-player/home/index.tsx
export const Route = createFileRoute('/main-player/home/')({
  component: HomePage,
  loader: async () => {
    await queryClient.ensureQueryData(
      songQuery.all({ sortType: 'dateAddedDescending', start: 0, end: 30 })
    );
    await queryClient.ensureQueryData(homeQuery.recentlyPlayedSongs);
    await queryClient.ensureQueryData(homeQuery.recentSongArtists);
    await queryClient.ensureQueryData(homeQuery.mostLovedSongs);
  }
});
```

### Pattern: Component Data Access (Suspense)

Use `useSuspenseQuery` for components inside route that already has loader:

```typescript
function HomePage() {
  const { data: latestSongs } = useSuspenseQuery(
    songQuery.all({ sortType: 'dateAddedDescending', start: 0, end: 30 })
  );

  const { data: recentlyPlayedSongs } = useSuspenseQuery(homeQuery.recentlyPlayedSongs);

  // Component renders safely with data
  return (
    <RecentlyPlayedSongs
      songs={recentlyPlayedSongs.slice(0, 10)}
      noOfVisibleSongs={10}
    />
  );
}
```

### Pattern: Conditional Queries

For queries that should only run based on conditions, use `enabled` option:

```typescript
const { data: artistInfo } = useSuspenseQuery({
  ...artistQuery.fetchOnlineInfo({ artistId: selectedArtistId }),
  enabled: !!selectedArtistId // Only fetch if artistId exists
});
```

---

## Mutations

Store both queries and mutations in the same module:

```typescript
// src/renderer/src/queries/settings.ts
export const settingsMutation = {
  toggleAutoLaunch: () => ({
    mutationFn: (autoLaunchState: boolean) =>
      window.api.settingsHelpers.toggleAutoLaunch(autoLaunchState),
    onSuccess: () => {
      queryClient.invalidateQueries(settingsQuery);
    }
  })
};

// Usage in component
const { mutate: toggleAutoLaunch } = useMutation(settingsMutation.toggleAutoLaunch());
```

---

## Cache Invalidation

When data changes via mutations, invalidate affected queries:

```typescript
// After toggling song favorite status
queryClient.invalidateQueries({
  queryKey: songQuery.all.queryKey // Invalidate all song queries
});

// After adding to playlist
queryClient.invalidateQueries({
  queryKey: playlistQuery.all.queryKey // Invalidate playlist list
});
```

---

## Error Handling

All query functions should gracefully handle errors and return safe defaults:

```typescript
// ✅ GOOD: Safe error boundary
export const homeQuery = createQueryKeys('home', {
  recentlyPlayedSongs: {
    queryKey: null,
    queryFn: async (): Promise<SongData[]> => {
      try {
        const { data: playlists } = await window.api.playlistsData.getPlaylistData([
          SpecialPlaylists.History
        ]);
        // ... process ...
        return Array.isArray(songs) ? songs : [];  // Fallback to empty array
      } catch (error) {
        console.error(error);
        return [];  // Return safe default
      }
    }
  }
});

// ❌ AVOID: Throwing errors without fallback
queryFn: async () => {
  const { data } = await window.api.playlistsData.getPlaylistData([...]);
  return data;  // Will throw if API fails, breaking component
}
```

---

## Query Key Naming Convention

1. **Query Module Name** (namespace): `songs`, `artists`, `home`, `playlists`
2. **Query Function Name** (descriptor): `all`, `single`, `favorites`, `recentlyPlayedSongs`
3. **Parameters** (dynamic cache keys): `sortType=${sortType}`, `songIds=${[...].sort().join(',')}`

Example:

```
homeQuery.recentlyPlayedSongs
  > Module: 'home'
  > Key: null (no params)
  > Cache: ['home', 'recentlyPlayedSongs']

songQuery.all({ sortType: 'aToZ', start: 0, end: 30 })
  > Module: 'songs'
  > Key: 'all', 'sortType=aToZ', 'start=0', 'end=30', 'limit=30'
  > Cache: ['songs', 'all', 'sortType=aToZ', 'start=0', 'end=30', 'limit=30']
```

---

## Common Patterns

### Pattern: Derived Query (Artist extraction from recently played songs)

When one query depends on another:

```typescript
const fetchRecentSongArtists = async (): Promise<Artist[]> => {
  try {
    // 1. Ensure recently played songs are cached
    const recentlyPlayedSongs = await queryClient.ensureQueryData(homeQuery.recentlyPlayedSongs);

    if (recentlyPlayedSongs.length === 0) return [];

    // 2. Extract artist IDs from songs
    const artistIds = [
      ...new Set(
        recentlyPlayedSongs
          .map((song) => song.artists?.map((artist) => artist.artistId) ?? [])
          .flat()
      )
    ];

    if (artistIds.length === 0) return [];

    // 3. Fetch artist data via IPC
    const { data: artists } = await window.api.artistsData.getArtistData(
      artistIds,
      undefined,
      undefined,
      0,
      35
    );

    return artists;
  } catch (error) {
    console.error(error);
    return [];
  }
};
```

### Pattern: Array Stabilization for Cache Keys

When query accepts an array parameter (e.g., song IDs), sort before building cache key:

```typescript
allSongInfo: (data: { songIds: number[] }) => {
  const { songIds } = data;
  return {
    queryKey: [
      // Sort to ensure cache key stability (always same regardless of input order)
      `songIds=${[...songIds].sort().join(',')}`
    ],
    queryFn: () => window.api.audioLibraryControls.getSongInfo(songIds)
  };
};
```

---

## Best Practices

1. **Keep query functions pure**: No side effects outside try/catch
2. **Return type-safe defaults**: Empty arrays, null, or sentinel values — never throw from queryFn
3. **Batch related queries**: If songs and artists are always fetched together, consider a combined query
4. **Use queryClient.ensureQueryData** in route loaders to pre-cache before render
5. **Centralize in `src/renderer/src/queries/`**: Never define queries inline in components
6. **Document query scope**: Add comments for complex queries about their IPC calls and dependencies
7. **Test error paths**: Queries should remain stable even if IPC fails

---

## Debugging

### Query Client DevTools

Install `@tanstack/react-query-devtools` to inspect cache:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### Cache Inspection

```typescript
// Log current cache state
console.log(queryClient.getQueryData(songQuery.all({ sortType: 'aToZ' }).queryKey));

// Manually invalidate and refetch
queryClient.invalidateQueries({
  queryKey: ['songs']
});
```

---

## Related Files

- **Query Modules**: `src/renderer/src/queries/*.ts`
- **IPC Bridge**: `src/preload/index.ts` (defines `window.api` interface)
- **Usage Example**: `src/renderer/src/routes/main-player/home/index.tsx`
- **Query Client Setup**: `src/renderer/src/index.tsx` (queryClient initialization)

import { useEffect } from 'react';
import { queryClient } from '..';
import { songQuery } from '../queries/songs';
import { artistQuery } from '../queries/aritsts';
import { albumQuery } from '../queries/albums';
import { playlistQuery } from '../queries/playlists';
import { genreQuery } from '../queries/genres';
import { searchQuery } from '../queries/search';
import { settingsQuery } from '@renderer/queries/settings';

/**
 * Hook for synchronizing data updates from the main process
 *
 * Listens to IPC data update events from the main process and
 * invalidates relevant React Query caches to keep the UI in sync
 * with backend changes.
 *
 * Handles the following data types:
 * - Songs (new, updated, deleted, artworks, palette, likes)
 * - Artists (new, updated, deleted, artworks, likes)
 * - Albums (new, updated, deleted)
 * - Playlists (new, updated, deleted, songs added/removed)
 * - Genres (new, updated, deleted)
 * - Settings (preferences, theme, window state, etc.)
 *
 * This hook automatically sets up IPC listeners and cleanup.
 *
 * @example
 * ```tsx
 * function App() {
 *   // Set up data synchronization
 *   useDataSync();
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDataSync(): void {
  useEffect(() => {
    const noticeDataUpdateEvents = (_: unknown, dataEvents: DataUpdateEvent[]) => {
      for (const dataEvent of dataEvents) {
        // Song events
        const songEvents: DataUpdateEventTypes[] = [
          'songs',
          'artists',
          'albums',
          'playlists',
          'genres',
          'songs/newSong',
          'songs/updatedSong',
          'songs/deletedSong',
          'songs/artworks',
          'songs/palette',
          'songs/likes'
        ];
        if (songEvents.includes(dataEvent.dataType)) {
          queryClient.invalidateQueries({ queryKey: songQuery._def });
          queryClient.invalidateQueries({ queryKey: searchQuery.query._def });
        }

        // Artist events
        const artistEvents: DataUpdateEventTypes[] = [
          'artists',
          'artists/artworks',
          'artists/likes',
          'artists/updatedArtist',
          'artists/deletedArtist',
          'artists/newArtist'
        ];
        if (artistEvents.includes(dataEvent.dataType)) {
          queryClient.invalidateQueries({ queryKey: artistQuery._def });
          queryClient.invalidateQueries({ queryKey: searchQuery.query._def });
        }

        // Album events
        const albumEvents: DataUpdateEventTypes[] = [
          'albums',
          'albums/updatedAlbum',
          'albums/deletedAlbum',
          'albums/newAlbum'
        ];
        if (albumEvents.includes(dataEvent.dataType)) {
          queryClient.invalidateQueries({ queryKey: albumQuery._def });
          queryClient.invalidateQueries({ queryKey: searchQuery.query._def });
        }

        // Playlist events
        const playlistEvents: DataUpdateEventTypes[] = [
          'playlists',
          'playlists/updatedPlaylist',
          'playlists/deletedPlaylist',
          'playlists/newPlaylist',
          'playlists/newSong',
          'playlists/deletedSong'
        ];
        if (playlistEvents.includes(dataEvent.dataType)) {
          queryClient.invalidateQueries({ queryKey: playlistQuery._def });
          queryClient.invalidateQueries({ queryKey: searchQuery.query._def });
        }

        // Genre events
        const genreEvents: DataUpdateEventTypes[] = [
          'genres',
          'genres/newGenre',
          'genres/updatedGenre',
          'genres/deletedGenre'
        ];
        if (genreEvents.includes(dataEvent.dataType)) {
          queryClient.invalidateQueries({ queryKey: genreQuery._def });
          queryClient.invalidateQueries({ queryKey: searchQuery.query._def });
        }

        // Settings events
        const settingEvents: DataUpdateEventTypes[] = [
          'userData',
          'userData/theme',
          'userData/windowPosition',
          'userData/windowDiamension',
          'userData/recentSearches',
          'userData/sortingStates',
          'settings/preferences'
        ];
        if (settingEvents.includes(dataEvent.dataType)) {
          queryClient.invalidateQueries({ queryKey: settingsQuery._def });

          if (dataEvent.dataType === 'userData/recentSearches') {
            queryClient.invalidateQueries({ queryKey: searchQuery.recentResults.queryKey });
          }
        }
      }
    };

    window.api.dataUpdates.dataUpdateEvent(noticeDataUpdateEvents);

    return () => {
      window.api.dataUpdates.removeDataUpdateEventListeners();
    };
  }, []);
}

import { useCallback, useContext, useRef } from 'react';

import { AppUpdateContext } from '../contexts/AppUpdateContext';

type LastFmTrack = {
  name: string;
  artist: string;
  url: string;
  playCount?: number;
  playedAt?: number;
};

type MatchResult = {
  lastFmTrack: LastFmTrack;
  matchedSongId: number | null;
};

const useLastFmConsumer = () => {
  const { addNewNotifications } = useContext(AppUpdateContext);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAndMatchTracks = useCallback(
    async (
      username: string,
      type: 'top' | 'recent' | 'loved',
      period?: string,
      limit?: number
    ): Promise<MatchResult[]> => {
      if (!username) return [];

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        let lastFmResult:
          | { tracks: LastFmTrack[] }
          | undefined;

        if (type === 'top') {
          lastFmResult = await window.api.lastFmUserData.getUserTopTracks(
            username,
            period as 'overall' | '7day' | '1month' | '3month' | '6month' | '12month',
            limit
          );
        } else if (type === 'recent') {
          lastFmResult = await window.api.lastFmUserData.getUserRecentTracks(username, limit);
        } else {
          lastFmResult = await window.api.lastFmUserData.getUserLovedTracks(username, limit);
        }

        if (!lastFmResult?.tracks) return [];

        const results: MatchResult[] = [];

        for (const track of lastFmResult.tracks) {
          if (abortRef.current.signal.aborted) break;

          const searchQuery = `${track.name} ${track.artist}`;
          const searchResults = await window.api.search.searchSongsByName({
            keyword: searchQuery,
            isSimilaritySearchEnabled: false
          });

          if (!searchResults || searchResults.length === 0) {
            results.push({ lastFmTrack: track, matchedSongId: null });
            continue;
          }

          const normalizedArtist = track.artist.toLowerCase().trim();
          const matched = searchResults.find((song) =>
            song.artists?.some(
              (a) => a.artist?.name?.toLowerCase().trim() === normalizedArtist
            )
          );

          results.push({
            lastFmTrack: track,
            matchedSongId: matched ? matched.songId : null
          });
        }

        return results;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[useLastFmConsumer] Error fetching/matching tracks:', error);
          addNewNotifications([
            {
              id: 'lastFmFetchError',
              duration: 5000,
              content: 'Failed to fetch Last.fm data'
            }
          ]);
        }
        return [];
      }
    },
    [addNewNotifications]
  );

  const syncToSmartPlaylist = useCallback(
    async (
      playlistId: number,
      username: string,
      type: 'top' | 'recent' | 'loved',
      period?: string,
      limit?: number
    ) => {
      const matches = await fetchAndMatchTracks(username, type, period, limit);
      const matchedIds = matches
        .filter((m) => m.matchedSongId !== null)
        .map((m) => m.matchedSongId!);

      if (matchedIds.length === 0) {
        addNewNotifications([
          {
            id: 'lastFmNoMatches',
            duration: 5000,
            content: 'No matching songs found in library'
          }
        ]);
        return;
      }

      const replaceResult = await window.api.playlistsData.replaceSmartPlaylistMembership(playlistId, matchedIds);

      if (!replaceResult.success) {
        addNewNotifications([
          {
            id: 'lastFmSyncFailed',
            duration: 5000,
            content: 'Failed to update smart playlist'
          }
        ]);
        return;
      }

      addNewNotifications([
        {
          id: 'lastFmSyncSuccess',
          duration: 5000,
          content: `Added ${matchedIds.length} songs from Last.fm`
        }
      ]);

      return { matched: matchedIds.length, total: matches.length };
    },
    [fetchAndMatchTracks, addNewNotifications]
  );

  return { fetchAndMatchTracks, syncToSmartPlaylist, abortRef };
};

export default useLastFmConsumer;

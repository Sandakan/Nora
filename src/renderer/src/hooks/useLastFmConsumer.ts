import { useCallback, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../contexts/AppUpdateContext';
import log from '../utils/log';

type LastFmTrack = {
  name: string;
  artist: string;
  url: string;
  playCount?: number;
  playedAt?: number | null;
  isNowPlaying?: boolean;
};

type MatchResult = {
  lastFmTrack: LastFmTrack;
  matchedSongId: number | null;
};

const useLastFmConsumer = () => {
  const { addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const fetchAndMatchTracks = useCallback(
    async (
      username: string,
      type: 'top' | 'recent' | 'loved',
      period?: string,
      limit?: number
    ): Promise<MatchResult[] | null> => {
      if (!username) return null;

      const controller = new AbortController();
      abortRef.current = controller;

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
          if (controller.signal.aborted) break;

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

        if (controller.signal.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError');
        }

        return results;
      } catch (error) {
        if ((error as Error).name === 'AbortError') throw error;
        log('[useLastFmConsumer] Error fetching/matching tracks', { error }, 'ERROR');
        addNewNotifications([
          {
            id: 'lastFmFetchError',
            duration: 5000,
            content: t('playlist.lastFmFetchFailed')
          }
        ]);
        return null;
      }
    },
    [addNewNotifications, t]
  );

  const syncToSmartPlaylist = useCallback(
    async (
      playlistId: number,
      username: string,
      type: 'top' | 'recent' | 'loved',
      period?: string,
      limit?: number
    ) => {
      let matches: MatchResult[] | null;
      try {
        matches = await fetchAndMatchTracks(username, type, period, limit);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        throw error;
      }
      if (matches === null) return;
      const matchedIds = matches
        .filter((m) => m.matchedSongId !== null)
        .map((m) => m.matchedSongId!);

      if (matchedIds.length === 0) {
        addNewNotifications([
          {
            id: 'lastFmNoMatches',
            duration: 5000,
            content: t('playlist.lastFmNoMatches')
          }
        ]);
        return;
      }

      const syncResult = await window.api.playlistsData.syncLastFmToSmartPlaylist(
        playlistId,
        matchedIds,
        { username, type, period, limit }
      );

      if (!syncResult.success) {
        addNewNotifications([
          {
            id: 'lastFmSyncFailed',
            duration: 5000,
            content: t('playlist.lastFmSyncFailed')
          }
        ]);
        return;
      }

      addNewNotifications([
        {
          id: 'lastFmSyncSuccess',
          duration: 5000,
          content: t('playlist.lastFmSyncSuccess', { count: matchedIds.length })
        }
      ]);

      return { matched: matchedIds.length, total: matches.length };
    },
    [fetchAndMatchTracks, addNewNotifications, t]
  );

  return { fetchAndMatchTracks, syncToSmartPlaylist, abortRef };
};

export default useLastFmConsumer;

import { getSongById, getSongsByNames } from '@main/db/queries/songs';
import { convertToSongData } from '@main/utils/convert';

import type {
  LastFMSimilarTracksAPI,
  ParsedSimilarTrack,
  SimilarTrack,
  SimilarTracksOutput
} from '../../../types/last_fm_similar_tracks_api';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';

const sortSimilarTracks = (a: ParsedSimilarTrack, b: ParsedSimilarTrack) => {
  if (a.match > b.match) return -1;
  if (a.match < b.match) return 1;
  return 0;
};

const parseSimilarTracks = async (similarTracks: SimilarTrack[]) => {
  const availableTracks: ParsedSimilarTrack[] = [];
  const unAvailableTracks: ParsedSimilarTrack[] = [];

  const availableSongs = await getSongsByNames(similarTracks.map((track) => track.name));

  for (const track of similarTracks) {
    const artists = track.artist?.name ? [track.artist.name] : [];
    const matchedSong = availableSongs.find((song) => {
      const isTitleMatch = song.title.toLowerCase() === track.name.toLowerCase();
      if (!isTitleMatch) return false;
      if (artists.length > 0 && song.artists && song.artists.length > 0) {
        return song.artists.some(
          (a) =>
            a.artist.name.toLowerCase().includes(artists[0].toLowerCase()) ||
            artists[0].toLowerCase().includes(a.artist.name.toLowerCase())
        );
      }
      return true;
    });

    if (matchedSong) {
      const song = convertToSongData(matchedSong);

      availableTracks.push({
        title: song.title,
        artists: song.artists?.map((artist) => artist.name),
        songData: song,
        match: track.match,
        url: track.url
      });
    } else {
      unAvailableTracks.push({
        title: track.name,
        artists,
        match: track.match,
        url: track.url
      });
    }
  }

  const sortedAvailTracks = availableTracks.sort(sortSimilarTracks);
  const sortedUnAvailTracks = unAvailableTracks.sort(sortSimilarTracks);

  return { sortedAvailTracks, sortedUnAvailTracks };
};

const getSimilarTracks = async (songId: number): Promise<SimilarTracksOutput> => {
  try {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const isOnline = checkIfConnectedToInternet();
    if (!isOnline) {
      const { getSimilarSongsForTrack } = await import('../../recommendations/recommendationEngine');
      const hybridFallback = await getSimilarSongsForTrack(songId, 10);
      return {
        sortedAvailTracks: hybridFallback.map((item) => ({
          title: item.song.title,
          artists: item.song.artists?.map((a) => a.name),
          songData: item.song,
          match: item.score,
          url: ''
        })),
        sortedUnAvailTracks: []
      };
    }

    const song = await getSongById(songId);
    if (!song) throw new Error(`Song with id of ${songId} not found in the database.`);

    const songData = convertToSongData(song);
    const { title, artists, mbid } = songData;
    const artistsStr = artists?.map((artist) => artist.name).join(', ') || '';

    const makeUrl = (useMbid: boolean) => {
      const url = new URL('https://ws.audioscrobbler.com/2.0/');
      url.searchParams.set('method', 'track.getSimilar');
      url.searchParams.set('api_key', LAST_FM_API_KEY);
      url.searchParams.set('limit', '10');
      url.searchParams.set('autocorrect', '1');
      url.searchParams.set('format', 'json');
      if (useMbid && mbid) {
        url.searchParams.set('mbid', mbid.trim());
      } else {
        url.searchParams.set('track', title);
        url.searchParams.set('artist', artistsStr);
      }
      return url;
    };

    let res = mbid ? await fetch(makeUrl(true)) : null;
    let data: LastFMSimilarTracksAPI | null =
      res && res.ok ? ((await res.json()) as LastFMSimilarTracksAPI) : null;

    if (!data || ('error' in data && data.error === 6)) {
      res = await fetch(makeUrl(false));
      if (res.ok) {
        data = (await res.json()) as LastFMSimilarTracksAPI;
      }
    }

    if (data && !('error' in data)) {
      const rawSimilarTracks = data.similartracks.track;
      const similarTracksList = Array.isArray(rawSimilarTracks)
        ? rawSimilarTracks
        : rawSimilarTracks
          ? [rawSimilarTracks]
          : [];

      // Opportunistically harvest similarities in the background
      import('../../recommendations/lastFmEnricher')
        .then(({ harvestSimilarTracks }) => harvestSimilarTracks(songId, similarTracksList))
        .catch(() => {});

      const parsedAndSortedSimilarTracks = await parseSimilarTracks(similarTracksList);

      if (parsedAndSortedSimilarTracks.sortedAvailTracks.length < 5) {
        const { getSimilarSongsForTrack } = await import(
          '../../recommendations/recommendationEngine'
        );
        const hybridFallback = await getSimilarSongsForTrack(songId, 10);
        const existingIds = new Set(
          parsedAndSortedSimilarTracks.sortedAvailTracks
            .map((t) => t.songData?.songId)
            .filter(Boolean)
        );
        for (const item of hybridFallback) {
          if (!existingIds.has(item.song.songId)) {
            parsedAndSortedSimilarTracks.sortedAvailTracks.push({
              title: item.song.title,
              artists: item.song.artists?.map((a) => a.name),
              songData: item.song,
              match: item.score,
              url: ''
            });
            existingIds.add(item.song.songId);
          }
        }
      }

      return parsedAndSortedSimilarTracks;
    }

    // Fallback to local hybrid similarities if Last.fm had no results
    const { getSimilarSongsForTrack } = await import('../../recommendations/recommendationEngine');
    const hybridFallback = await getSimilarSongsForTrack(songId, 10);
    return {
      sortedAvailTracks: hybridFallback.map((item) => ({
        title: item.song.title,
        artists: item.song.artists?.map((a) => a.name),
        songData: item.song,
        match: item.score,
        url: ''
      })),
      sortedUnAvailTracks: []
    };
  } catch (error) {
    logger.error('Failed to get similar tracks of a song.', { error, songId });
    try {
      const { getSimilarSongsForTrack } = await import(
        '../../recommendations/recommendationEngine'
      );
      const hybridFallback = await getSimilarSongsForTrack(songId, 10);
      return {
        sortedAvailTracks: hybridFallback.map((item) => ({
          title: item.song.title,
          artists: item.song.artists?.map((a) => a.name),
          songData: item.song,
          match: item.score,
          url: ''
        })),
        sortedUnAvailTracks: []
      };
    } catch {
      return { sortedAvailTracks: [], sortedUnAvailTracks: [] };
    }
  }
};

export default getSimilarTracks;

import logger from '../../logger';
import { getSongsData } from '../../filesystem';
import {
  LastFMSimilarTracksAPI,
  ParsedSimilarTrack,
  SimilarTrack,
  SimilarTracksOutput
} from '../../../@types/last_fm_similar_tracks_api';
import { checkIfConnectedToInternet } from '../../main';
import { getSongArtworkPath } from '../../fs/resolveFilePaths';
import { isSongBlacklisted } from '../../utils/isBlacklisted';
import { getSelectedPaletteData } from '../generatePalette';

const sortSimilarTracks = (a: ParsedSimilarTrack, b: ParsedSimilarTrack) => {
  if (a.match > b.match) return -1;
  if (a.match < b.match) return 1;
  return 0;
};

export const getAudioInfoFromSavableSongData = (song: SavableSongData): AudioInfo => {
  const isBlacklisted = isSongBlacklisted(song.songId, song.path);

  return {
    title: song.title,
    artists: song.artists,
    album: song.album,
    duration: song.duration,
    artworkPaths: getSongArtworkPath(song.songId, song.isArtworkAvailable),
    path: song.path,
    year: song.year,
    songId: song.songId,
    paletteData: getSelectedPaletteData(song.paletteId),
    addedDate: song.addedDate,
    isAFavorite: song.isAFavorite,
    isBlacklisted
  };
};

const parseSimilarTracks = (similarTracks: SimilarTrack[], songs: SavableSongData[]) => {
  const availableTracks: ParsedSimilarTrack[] = [];
  const unAvailableTracks: ParsedSimilarTrack[] = [];

  similarTrackLoop: for (const track of similarTracks) {
    for (const song of songs) {
      if (song.title === track.name) {
        availableTracks.push({
          title: song.title,
          artists: song.artists?.map((artist) => artist.name),
          songData: getAudioInfoFromSavableSongData(song),
          match: track.match,
          url: track.url
        });
        continue similarTrackLoop;
      }
    }
    unAvailableTracks.push({
      title: track.name,
      artists: [track.artist.name],
      match: track.match,
      url: track.url
    });
  }

  const sortedAvailTracks = availableTracks.sort(sortSimilarTracks);
  const sortedUnAvailTracks = unAvailableTracks.sort(sortSimilarTracks);

  return { sortedAvailTracks, sortedUnAvailTracks };
};

const getSelectedSong = (songs: SavableSongData[], songId: string) => {
  for (const song of songs) {
    if (song.songId === songId) return song;
  }
  throw new Error(`Song with ${songId} does not exist in the library.`);
};

const getSimilarTracks = async (songId: string): Promise<SimilarTracksOutput> => {
  try {
    const songs = getSongsData();

    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const isOnline = checkIfConnectedToInternet();
    if (!isOnline) throw new Error('App not connected to internet.');

    const { title, artists } = getSelectedSong(songs, songId);
    const artistsStr = artists?.map((artist) => artist.name).join(', ') || '';

    const url = new URL('http://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'track.getSimilar');
    url.searchParams.set('api_key', LAST_FM_API_KEY);
    url.searchParams.set('track', title);
    url.searchParams.set('artist', artistsStr);
    url.searchParams.set('limit', '10');
    url.searchParams.set('autocorrect', '1');
    url.searchParams.set('format', 'json');

    const res = await fetch(url);
    if (res.ok) {
      const data: LastFMSimilarTracksAPI = await res.json();

      if ('error' in data) throw new Error(`${data.error} - ${data.message}`);

      const similarTracks = data.similartracks.track;
      const parsedAndSortedSimilarTracks = parseSimilarTracks(similarTracks, songs);

      return parsedAndSortedSimilarTracks;
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to get similar tracks of a song.', { error, songId });
    return undefined;
  }
};

export default getSimilarTracks;

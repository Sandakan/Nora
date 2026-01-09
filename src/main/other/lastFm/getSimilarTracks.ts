import logger from '../../logger';
import type {
  LastFMSimilarTracksAPI,
  ParsedSimilarTrack,
  SimilarTrack,
  SimilarTracksOutput
} from '../../../types/last_fm_similar_tracks_api';
import { checkIfConnectedToInternet } from '../../main';
import { getSongById, getSongsByNames } from '@main/db/queries/songs';
import { convertToSongData } from '@main/utils/convert';

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
    const matchedSong = availableSongs.find(
      (song) => song.title.toLowerCase() === track.name.toLowerCase()
    );

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
    if (!isOnline) throw new Error('App not connected to internet.');

    const song = await getSongById(songId);
    if (!song) throw new Error(`Song with id of ${songId} not found in the database.`);

    const { title, artists } = convertToSongData(song);
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
      const parsedAndSortedSimilarTracks = parseSimilarTracks(similarTracks);

      return parsedAndSortedSimilarTracks;
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to get similar tracks of a song.', { error, songId });
    return undefined;
  }
};

export default getSimilarTracks;

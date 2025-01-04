import { checkIfConnectedToInternet } from '../../main';
import { getAlbumsData, getSongsData } from '../../filesystem';
import logger from '../../logger';
import {
  LastFMAlbumInfoAPI,
  AlbumInfo,
  ParsedAlbumTrack,
  LastFMAlbumInfo,
  Tag
} from '../../../@types/last_fm_album_info_api';
import { getAudioInfoFromSavableSongData } from './getSimilarTracks';

const getSelectedAlbum = (albums: SavableAlbum[], albumId: string) => {
  for (const album of albums) {
    if (album.albumId === albumId) return album;
  }
  throw new Error(`Album with ${albumId} does not exist in the library.`);
};

const sortTracks = (a: ParsedAlbumTrack, b: ParsedAlbumTrack) => {
  if (a.rank > b.rank) return 1;
  if (a.rank < b.rank) return -1;
  return 0;
};

const getParsedAlbumTags = (tags?: Tag | Tag[]) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'object') return [tags];
  return [];
};

const parseAlbumInfoFromLastFM = (
  lastFmAlbumInfo: AlbumInfo,
  album: SavableAlbum
): LastFMAlbumInfo => {
  const { tracks, tags, wiki } = lastFmAlbumInfo;
  const songs = getSongsData();
  const tracksData = tracks?.track;
  const albumSongIds = album.songs.map((albumSong) => albumSong.songId);

  const availableTracksLinkedToAlbum: ParsedAlbumTrack[] = [];
  const availableTracksUnlinkedToAlbum: ParsedAlbumTrack[] = [];
  const unAvailableTracks: ParsedAlbumTrack[] = [];

  if (Array.isArray(tracksData)) {
    trackLoop: for (const track of tracksData) {
      for (const song of songs) {
        if (song.title === track.name) {
          if (albumSongIds.includes(song.songId)) {
            availableTracksLinkedToAlbum.push({
              title: song.title,
              artists: song.artists?.map((artist) => artist.name),
              songData: getAudioInfoFromSavableSongData(song),
              url: track.url,
              rank: track['@attr'].rank
            });
          } else {
            availableTracksUnlinkedToAlbum.push({
              title: song.title,
              artists: song.artists?.map((artist) => artist.name),
              songData: getAudioInfoFromSavableSongData(song),
              url: track.url,
              rank: track['@attr'].rank
            });
          }
          continue trackLoop;
        }
      }
      unAvailableTracks.push({
        title: track.name,
        artists: [track.artist.name],
        url: track.url,
        rank: track['@attr'].rank
      });
    }

    const sortedAvailAlbumTracks = availableTracksLinkedToAlbum.sort(sortTracks);
    const sortedAvailNonAlbumTracks = availableTracksUnlinkedToAlbum.sort(sortTracks);
    const sortedUnAvailAlbumTracks = unAvailableTracks.sort(sortTracks);
    const sortedAllAlbumTracks = availableTracksLinkedToAlbum
      .concat(unAvailableTracks)
      .sort(sortTracks);
    const sortedAllTracks = availableTracksLinkedToAlbum
      .concat(availableTracksUnlinkedToAlbum, unAvailableTracks)
      .sort(sortTracks);

    const albumWiki = wiki?.summary;

    return {
      sortedAllTracks,
      sortedAllAlbumTracks,
      sortedAvailAlbumTracks,
      sortedAvailNonAlbumTracks,
      sortedUnAvailAlbumTracks,
      tags: getParsedAlbumTags(tags?.tag),
      wiki: albumWiki
    };
  }
  return {
    sortedAllTracks: [],
    sortedAllAlbumTracks: [],
    sortedAvailAlbumTracks: [],
    sortedAvailNonAlbumTracks: [],
    sortedUnAvailAlbumTracks: [],
    tags: getParsedAlbumTags(tags?.tag)
  };
};

const getAlbumInfoFromLastFM = async (albumId: string): Promise<LastFMAlbumInfo | undefined> => {
  try {
    const albums = getAlbumsData();

    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const isOnline = checkIfConnectedToInternet();
    if (!isOnline) throw new Error('App not connected to internet.');

    const selectedAlbum = getSelectedAlbum(albums, albumId);
    const { title, artists = [] } = selectedAlbum;
    const artistsStr = artists?.map((artist) => artist.name).join(', ') || '';

    const url = new URL('http://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'album.getInfo');
    url.searchParams.set('api_key', LAST_FM_API_KEY);
    url.searchParams.set('album', title);
    url.searchParams.set('artist', artistsStr);
    url.searchParams.set('limit', '10');
    url.searchParams.set('autocorrect', '1');
    url.searchParams.set('format', 'json');

    const res = await fetch(url);
    if (res.ok) {
      const data: LastFMAlbumInfoAPI = await res.json();
      if ('error' in data) throw new Error(`${data.error} - ${data.message}`);

      const downloadedAlbumData = data.album;
      const parsedAlbumData = parseAlbumInfoFromLastFM(downloadedAlbumData, selectedAlbum);
      return parsedAlbumData;
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to try to get album info of an album from LastFM.', { error });
    return undefined;
  }
};

export default getAlbumInfoFromLastFM;

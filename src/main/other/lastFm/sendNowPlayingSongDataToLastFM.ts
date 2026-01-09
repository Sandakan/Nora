import logger from '../../logger';
import type {
  LastFMScrobblePostResponse,
  updateNowPlayingParams
} from '../../../types/last_fm_api';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';
import { getSongById } from '@main/db/queries/songs';
import { convertToSongData } from '@main/utils/convert';
import { getUserSettings } from '@main/db/queries/settings';

const sendNowPlayingSongDataToLastFM = async (songId: number) => {
  try {
    const { sendNowPlayingSongDataToLastFM: isScrobblingEnabled } = await getUserSettings();
    const isConnectedToInternet = checkIfConnectedToInternet();

    if (isScrobblingEnabled && isConnectedToInternet) {
      const songData = await getSongById(songId);

      // TODO: Handle songs outside library properly in DB
      // const songs = getSongsData();
      // let song = songs.find((x) => x.songId === songId);
      // if (song === undefined) {
      //   const songsOutsideLibrary = getSongsOutsideLibraryData();
      //   const data = songsOutsideLibrary.find((x) => x.songId === songId);
      //   if (data)
      //     song = {
      //       ...data,
      //       albumArtists: [],
      //       trackNo: undefined,
      //       isArtworkAvailable: !!data.artworkPath,
      //       addedDate: Date.now()
      //     };
      // }

      if (songData) {
        const song = convertToSongData(songData);
        const authData = await getLastFmAuthData();

        const url = new URL('http://ws.audioscrobbler.com/2.0/');
        url.searchParams.set('format', 'json');

        const params: updateNowPlayingParams = {
          track: song.title,
          artist: song.artists?.map((artist) => artist.name).join(', ') || '',
          album: song.album?.name,
          albumArtist: song?.albumArtists?.map((artist) => artist.name).join(', '),
          trackNumber: song?.trackNo,
          duration: Math.ceil(song.duration)
        };

        const body = generateApiRequestBodyForLastFMPostRequests({
          method: 'track.updateNowPlaying',
          authData,
          params
        });

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        });

        if (res.status === 200)
          return logger.debug(`Now playing song data accepted in LastFM.`, { songId });

        const json: LastFMScrobblePostResponse = await res.json();
        return logger.warn('Failed to send now playing song to LastFM', { json, songId });
      }
    }
    return logger.debug('Now playing song request ignored', {
      isScrobblingEnabled,
      isConnectedToInternet
    });
  } catch (error) {
    return logger.error('Failed to send now playing song data to LastFM.', {
      error
    });
  }
};

export default sendNowPlayingSongDataToLastFM;

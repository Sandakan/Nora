/* eslint-disable no-await-in-loop */
import path from 'path';
import { app } from 'electron';
import * as musicMetaData from 'music-metadata';

import { isSongBlacklisted } from '../utils/isBlacklisted';
import { DEFAULT_FILE_URL, getArtistsData, getSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import getArtistInfoFromNet from './getArtistInfoFromNet';
import addToSongsHistory from './addToSongsHistory';
import updateSongListeningData from './updateSongListeningData';
import { setCurrentSongPath } from '../main';

const IS_DEVELOPMENT =
  !app.isPackaged || process.env.NODE_ENV === 'development';

const getArtworkData = (artworkData?: Buffer) => {
  if (artworkData === undefined) return undefined;

  if (IS_DEVELOPMENT) return Buffer.from(artworkData).toString('base64');
  return artworkData;
};

const getRelevantArtistData = (
  songArtists?: {
    artistId: string;
    name: string;
  }[],
) => {
  const artists = getArtistsData();
  const relevantArtists: {
    artistId: string;
    artworkName?: string;
    name: string;
    onlineArtworkPaths?: OnlineArtistArtworks;
  }[] = [];

  if (songArtists) {
    for (const songArtist of songArtists) {
      for (const artist of artists) {
        if (artist.artistId === songArtist.artistId) {
          if (!artist.onlineArtworkPaths)
            getArtistInfoFromNet(artist.artistId).catch((err) => log(err));

          const { artistId, name, artworkName, onlineArtworkPaths } = artist;

          relevantArtists.push({
            artistId,
            name,
            artworkName,
            onlineArtworkPaths,
          });
        }
      }
    }
  }

  return relevantArtists;
};

export const sendAudioData = async (
  audioId: string,
): Promise<AudioPlayerData> => {
  log(`Fetching song data for song id -${audioId}-`);
  try {
    const songs = getSongsData();

    if (songs) {
      for (let x = 0; x < songs.length; x += 1) {
        if (songs[x].songId === audioId) {
          const song = songs[x];
          const metadata = await musicMetaData.parseFile(song.path);

          if (metadata) {
            const artworkData = metadata.common.picture
              ? metadata.common.picture[0].data
              : undefined;

            addToSongsHistory(song.songId);
            const songArtists = getRelevantArtistData(song.artists);

            const data: AudioPlayerData = {
              title: song.title,
              artists: songArtists.length > 0 ? songArtists : song.artists,
              duration: song.duration,
              // artwork: await getArtworkLink(artworkData),
              artwork: getArtworkData(artworkData),
              artworkPath: getSongArtworkPath(
                song.songId,
                song.isArtworkAvailable,
              ).artworkPath,
              path: path.join(DEFAULT_FILE_URL, song.path),
              songId: song.songId,
              isAFavorite: song.isAFavorite,
              album: song.album,
              palette: song.palette,
              isKnownSource: true,
              isBlacklisted: isSongBlacklisted(song.songId, song.path),
            };

            updateSongListeningData(song.songId, 'listens', 'increment');
            setCurrentSongPath(song.path);
            return data;
            // return log(`total : ${console.timeEnd('total')}`);
          }
          log(
            `ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA`,
            undefined,
            'ERROR',
          );
          throw new Error(
            'ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA',
          );
        }
      }
      log(`No matching song for songId -${audioId}-`);
      throw new Error('SONG_NOT_FOUND' as ErrorCodes);
    }
    log(
      `ERROR OCCURRED WHEN READING data.json TO GET SONGS DATA. data.json FILE DOESN'T EXIST OR SONGS ARRAY IS EMPTY.`,
      undefined,
      'ERROR',
    );
    throw new Error('EMPTY_SONG_ARRAY' as ErrorCodes);
  } catch (err) {
    log(`ERROR OCCURRED WHEN TRYING TO SEND SONGS DATA.`, { err }, 'WARN');
    throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
  }
};

export default sendAudioData;

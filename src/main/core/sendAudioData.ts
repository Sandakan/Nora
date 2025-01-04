import path from 'path';
import { app } from 'electron';
import * as musicMetaData from 'music-metadata';

import { isSongBlacklisted } from '../utils/isBlacklisted';
import { DEFAULT_FILE_URL, getArtistsData, getSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import logger from '../logger';
import getArtistInfoFromNet from './getArtistInfoFromNet';
import addToSongsHistory from './addToSongsHistory';
import updateSongListeningData from './updateSongListeningData';
// import { setDiscordRpcActivity } from '../other/discordRPC';
import { setCurrentSongPath } from '../main';
import { getSelectedPaletteData } from '../other/generatePalette';

const IS_DEVELOPMENT = !app.isPackaged || process.env.NODE_ENV === 'development';

const getArtworkData = (artworkData?: Buffer | Uint8Array) => {
  if (artworkData === undefined) return undefined;

  if (IS_DEVELOPMENT) return Buffer.from(artworkData).toString('base64');
  return artworkData;
};

const getRelevantArtistData = (
  songArtists?: {
    artistId: string;
    name: string;
  }[]
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
            getArtistInfoFromNet(artist.artistId).catch((error) =>
              logger.warn('Failed to get artist info from net', { err: error })
            );

          const { artistId, name, artworkName, onlineArtworkPaths } = artist;

          relevantArtists.push({
            artistId,
            name,
            artworkName,
            onlineArtworkPaths
          });
        }
      }
    }
  }

  return relevantArtists;
};

export const sendAudioData = async (audioId: string): Promise<AudioPlayerData> => {
  logger.debug(`Fetching song data for song id -${audioId}-`);
  try {
    const songs = getSongsData();

    if (songs) {
      for (let x = 0; x < songs.length; x += 1) {
        if (songs[x].songId === audioId) {
          const song = songs[x];
          // TODO: Unknown type error
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
              artworkPath: getSongArtworkPath(song.songId, song.isArtworkAvailable).artworkPath,
              path: path.join(DEFAULT_FILE_URL, song.path),
              songId: song.songId,
              isAFavorite: song.isAFavorite,
              album: song.album,
              paletteData: getSelectedPaletteData(song.paletteId),
              isKnownSource: true,
              isBlacklisted: isSongBlacklisted(song.songId, song.path)
            };

            updateSongListeningData(song.songId, 'listens', 1);

            // const now = Date.now();
            // setDiscordRpcActivity({
            //   details: `Listening to '${data.title}'`,
            //   state: `By ${data.artists?.map((artist) => artist.name).join(', ')}`,
            //   largeImageKey: 'nora_logo',
            //   smallImageKey: 'song_artwork',
            //   startTimestamp: now,
            //   endTimestamp: now + data.duration * 1000
            // });
            setCurrentSongPath(song.path);
            return data;
            // returnlogger.debug(`total : ${console.timeEnd('total')}`);
          }
          logger.error(`Failed to parse the song to get metadata`, { audioId });
          throw new Error('ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA');
        }
      }
      logger.error(`No matching song to send audio data`, { audioId });
      throw new Error('SONG_NOT_FOUND' as ErrorCodes);
    }
    logger.error(`Failed to read data.json because it doesn't exist or is empty.`, {
      audioId,
      songs: typeof songs,
      isArray: Array.isArray(songs)
    });
    throw new Error('EMPTY_SONG_ARRAY' as ErrorCodes);
  } catch (error) {
    logger.error(`Failed to send songs data.`, { err: error });
    throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
  }
};

export default sendAudioData;

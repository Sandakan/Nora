import path from 'path';
import * as musicMetaData from 'music-metadata';
import { appPreferences } from '../../../package.json';
import { createTempArtwork } from '../other/artworks';
import { DEFAULT_FILE_URL, getSongsData } from '../filesystem';
import logger from '../logger';
import { sendMessageToRenderer, addToSongsOutsideLibraryData } from '../main';
import { generateRandomId } from '../utils/randomId';
import sendAudioData from './sendAudioData';

import songCoverImage from '../../renderer/src/assets/images/webp/song_cover_default.webp?asset';

const sendAudioDataFromPath = async (songPath: string): Promise<AudioPlayerData> => {
  logger.debug(`Parsing song data from path`, { songPath });

  if (appPreferences.supportedMusicExtensions.some((ext) => path.extname(songPath).includes(ext))) {
    const songs = getSongsData();

    try {
      // TODO: Unknown type error
      const metadata = await musicMetaData.parseFile(songPath);

      if (Array.isArray(songs)) {
        if (songs.length > 0) {
          for (let x = 0; x < songs.length; x += 1) {
            if (songs[x].path === songPath) {
              const audioData = await sendAudioData(songs[x].songId);

              if (audioData) return audioData;
              throw new Error('Audio data generation failed.');
            }
          }
        }
        if (metadata) {
          const artworkData = metadata.common.picture ? metadata.common.picture[0].data : '';

          const tempArtworkPath = path.join(
            DEFAULT_FILE_URL,
            metadata.common.picture
              ? ((await createTempArtwork(metadata.common.picture[0].data).catch((error) => {
                  logger.error(`Failed to create song artwork from an unknown source.`, {
                    error,
                    songPath
                  });
                  return songCoverImage;
                })) ?? songCoverImage)
              : songCoverImage
          );

          const title =
            metadata.common.title || path.basename(songPath).split('.')[0] || 'Unknown Title';

          const data: AudioPlayerData = {
            title,
            artists: metadata.common.artists?.map((artistName) => ({
              artistId: '',
              name: artistName
            })),
            duration: metadata.format.duration ?? 0,
            artwork: Buffer.from(artworkData).toString('base64') || undefined,
            artworkPath: tempArtworkPath,
            path: path.join(DEFAULT_FILE_URL, songPath),
            songId: generateRandomId(),
            isAFavorite: false,
            isKnownSource: false,
            isBlacklisted: false
          };

          addToSongsOutsideLibraryData(data);

          sendMessageToRenderer({
            messageCode: 'PLAYBACK_FROM_UNKNOWN_SOURCE'
          });
          return data;
        }
        logger.error(`No matching song for songId -${songPath}-`);
        throw new Error('SONG_NOT_FOUND' as ErrorCodes);
      }
      logger.error(`Failed to read data.json because it doesn't exist or is empty.`);
      throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
    } catch (error) {
      logger.debug(`Failed to send songs data from an unparsed source.`, { error });
      throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
    }
  } else {
    logger.debug(`User tried to open a file with an unsupported extension.`, { songPath });
    throw new Error('UNSUPPORTED_FILE_EXTENSION' as ErrorCodes);
  }
};

export default sendAudioDataFromPath;

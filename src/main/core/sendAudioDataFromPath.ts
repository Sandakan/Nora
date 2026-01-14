import path from 'path';
import { File } from 'node-taglib-sharp';
import { appPreferences } from '../../../package.json';
import { createTempArtwork } from '../other/artworks';
import { DEFAULT_FILE_URL } from '../filesystem';
import logger from '../logger';
import { sendMessageToRenderer, addToSongsOutsideLibraryData } from '../main';
import sendAudioData, { parseArtworkDataForAudioPlayerData } from './sendAudioData';

import songCoverImage from '../../renderer/src/assets/images/webp/song_cover_default.webp?asset';
import { getSongIdFromSongPath } from '@main/db/queries/songs';

const sendAudioDataFromPath = async (songPath: string): Promise<AudioPlayerData> => {
  logger.debug(`Parsing song data from path`, { songPath });

  if (appPreferences.supportedMusicExtensions.some((ext) => path.extname(songPath).includes(ext))) {
    const selectedSongId = await getSongIdFromSongPath(songPath);

    try {
      if (selectedSongId) {
        const audioData = await sendAudioData(selectedSongId);

        if (audioData) return audioData;
        throw new Error('Audio data generation failed.');
      }

      const file = File.createFromPath(songPath);
      const metadata = file.tag;
      if (metadata) {
        const artworkData = metadata.pictures?.at(0)?.data?.toByteArray();

        const tempArtworkPath = path.join(
          DEFAULT_FILE_URL,
          metadata.pictures
            ? ((await createTempArtwork(metadata.pictures[0].data.toByteArray()).catch((error) => {
                logger.error(`Failed to create song artwork from an unknown source.`, {
                  error,
                  songPath
                });
                return songCoverImage;
              })) ?? songCoverImage)
            : songCoverImage
        );

        const title = metadata.title || path.basename(songPath).split('.')[0] || 'Unknown Title';

        const data: AudioPlayerData = {
          title,
          artists: metadata.performers?.map((artistName) => ({
            artistId: 0,
            name: artistName
          })),
          duration: (file.properties.durationMilliseconds ?? 0) / 1000,
          artwork: parseArtworkDataForAudioPlayerData(artworkData),
          artworkPath: tempArtworkPath,
          path: path.join(DEFAULT_FILE_URL, songPath),
          songId: Math.floor(Math.random() * 1000000),
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

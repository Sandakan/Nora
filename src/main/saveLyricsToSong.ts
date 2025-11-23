import path from 'path';
import NodeID3 from 'node-id3';

import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';
import { updateCachedLyrics } from './core/getSongLyrics';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import { appPreferences } from '../../package.json';
import { dataUpdateEvent, sendMessageToRenderer } from './main';
import saveLyricsToLRCFile from './core/saveLyricsToLrcFile';
import logger from './logger';
import { getUserSettings } from './db/queries/settings';

const { metadataEditingSupportedExtensions } = appPreferences;

type PendingSongLyrics = {
  title: string;
  synchronisedLyrics: SynchronisedLyrics;
  unsynchronisedLyrics: UnsynchronisedLyrics;
};

const pendingSongLyrics = new Map<string, PendingSongLyrics>();

const saveLyricsToSong = async (songPathWithProtocol: string, songLyrics: SongLyrics) => {
  const { saveLyricsInLrcFilesForSupportedSongs } = await getUserSettings();
  const songPath = removeDefaultAppProtocolFromFilePath(songPathWithProtocol);

  if (songLyrics && songLyrics.lyrics.parsedLyrics.length > 0) {
    const pathExt = path.extname(songPath).replace(/\W/, '');
    const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);

    if (!isASupportedFormat || saveLyricsInLrcFilesForSupportedSongs)
      saveLyricsToLRCFile(songPath, songLyrics);

    if (isASupportedFormat) {
      const prevTags = await NodeID3.Promise.read(songPath);

      const { isSynced } = songLyrics.lyrics;
      const unsynchronisedLyrics: UnsynchronisedLyrics = !isSynced
        ? {
            language: 'ENG',
            text: songLyrics.lyrics.unparsedLyrics
          }
        : prevTags.unsynchronisedLyrics;

      const synchronisedLyrics = isSynced
        ? convertParsedLyricsToNodeID3Format(songLyrics.lyrics)
        : prevTags.synchronisedLyrics;

      try {
        const updatingTags = {
          title: songLyrics.title,
          unsynchronisedLyrics,
          synchronisedLyrics: synchronisedLyrics || []
        };
        // Kept to be saved later
        pendingSongLyrics.set(songPath, updatingTags);

        updateCachedLyrics((prevLyrics) => {
          if (prevLyrics)
            return {
              ...prevLyrics,
              ...songLyrics,
              source: 'IN_SONG_LYRICS',
              isOfflineLyricsAvailable: true
            };
          return undefined;
        });
        logger.info(`Lyrics for '${songLyrics.title}' will be saved automatically.`, {
          songPath
        });
        return sendMessageToRenderer({
          messageCode: 'LYRICS_SAVE_QUEUED',
          data: { title: songLyrics.title }
        });
      } catch (error) {
        logger.error(`Failed to update the song file with the new updates. `, { error });
      }
    } else {
      logger.info(`Lyrics for this song with '${pathExt}' extension will be saved in a LRC file.`, {
        songPath
      });
      return sendMessageToRenderer({
        messageCode: 'LYRICS_SAVED_IN_LRC_FILE',
        data: { ext: pathExt }
      });
    }
  }

  const errorMessage = 'No lyrics found to be saved to the song.';
  logger.error(errorMessage, { songPath });
  throw new Error(errorMessage);
};

export const isLyricsSavePending = (songPath: string) => pendingSongLyrics.has(songPath);

export const savePendingSongLyrics = (currentSongPath = '', forceSave = false) => {
  if (pendingSongLyrics.size === 0) return logger.info('No pending song lyrics found.');

  logger.info(`Started saving pending song lyrics.`, {
    pendingSongs: pendingSongLyrics.keys
  });

  const entries = pendingSongLyrics.entries();

  for (const [songPath, updatingTags] of entries) {
    const isACurrentlyPlayingSong = songPath === currentSongPath;

    if (forceSave || !isACurrentlyPlayingSong) {
      try {
        NodeID3.update(updatingTags, songPath);

        logger.info(`Successfully saved pending lyrics of '${updatingTags.title}'.`, { songPath });
        sendMessageToRenderer({
          messageCode: 'PENDING_LYRICS_SAVED',
          data: { title: updatingTags.title }
        });
        dataUpdateEvent('songs/lyrics');
        pendingSongLyrics.delete(songPath);
      } catch (error) {
        logger.error(`Failed to save pending song lyrics of a song. `, { error, songPath });
      }
    }
  }
  return undefined;
};

export default saveLyricsToSong;

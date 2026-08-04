import path from 'path';

import { appPreferences } from '../../package.json';
import { updateCachedLyrics } from './core/getSongLyrics';
import saveLyricsToLRCFile from './core/saveLyricsToLrcFile';
import { getUserSettings } from './db/queries/settings';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import logger from './logger';
import { dataUpdateEvent, sendMessageToRenderer } from './main';
import { withFileHandle } from './utils/withFileHandle';

const { metadataEditingSupportedExtensions } = appPreferences;

type PendingSongLyrics = {
  title: string;
  lyrics: string;
};

const pendingSongLyrics = new Map<string, PendingSongLyrics>();

const saveLyricsToSong = async (songPathWithProtocol: string, songLyrics: SongLyrics) => {
  const { saveLyricsInLrcFilesForSupportedSongs } = await getUserSettings();
  const songPath = removeDefaultAppProtocolFromFilePath(songPathWithProtocol);

  if (songLyrics && songLyrics.lyrics.parsedLyrics.length > 0) {
    const pathExt = path.extname(songPath).replace(/\W/, '');
    const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);
    const lyricsToSave = songLyrics.lyrics.unparsedLyrics;
    const shouldSaveLrcFile =
      !isASupportedFormat || saveLyricsInLrcFilesForSupportedSongs || songLyrics.lyrics.isSynced;

    if (shouldSaveLrcFile) {
      // Await so a failed LRC write surfaces as an error instead of an
      // unhandled rejection while the save flow reports success.
      try {
        await saveLyricsToLRCFile(songPath, songLyrics);
      } catch (error) {
        logger.error(`Failed to save lyrics to LRC file.`, { error, songPath });
        return sendMessageToRenderer({
          messageCode: 'LYRICS_SAVE_FAILED',
          data: { title: songLyrics.title }
        });
      }
    }

    if (isASupportedFormat) {
      try {
        if (typeof lyricsToSave !== 'string' || lyricsToSave.length === 0)
          throw new Error('No lyrics content available to save to the audio file.');

        const updatingTags = {
          title: songLyrics.title,
          lyrics: lyricsToSave
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

export const savePendingSongLyrics = async (currentSongPath = '', forceSave = false) => {
  if (pendingSongLyrics.size === 0) return logger.info('No pending song lyrics found.');

  logger.info(`Started saving pending song lyrics.`, {
    pendingSongs: pendingSongLyrics.keys
  });

  const { customLrcFilesSaveLocation } = await getUserSettings();
  const entries = pendingSongLyrics.entries();

  for (const [songPath, updatingTags] of entries) {
    const isACurrentlyPlayingSong = songPath === currentSongPath;

    if (forceSave || !isACurrentlyPlayingSong) {
      try {
        await withFileHandle(songPath, async (file) => {
          file.tag.lyrics = updatingTags.lyrics;
          file.save();
        });

        logger.info(`Successfully saved pending lyrics of '${updatingTags.title}'.`, { songPath });
        sendMessageToRenderer({
          messageCode: 'PENDING_LYRICS_SAVED',
          data: { title: updatingTags.title }
        });
        dataUpdateEvent('songs/lyrics');

        const { upsertSongLyrics, invalidateLyricsIndex } =
          await import('@main/db/queries/lyricsIndex');
        const { getSongByPath } = await import('@main/db/queries/songs');
        const song = await getSongByPath(songPath).catch(() => undefined);
        if (song) {
          const result = await upsertSongLyrics(
            song.id,
            songPath,
            customLrcFilesSaveLocation
          ).catch((err) => {
            logger.error('Failed to re-index lyrics after save', { err, songId: song.id });
            return 'read-error' as const;
          });
          if (result === 'read-error') {
            invalidateLyricsIndex();
            logger.warn('Lyric re-index after pending save failed; will retry on next startup.', {
              songId: song.id
            });
          }
        }
        pendingSongLyrics.delete(songPath);
      } catch (error) {
        logger.error(`Failed to save pending song lyrics of a song. `, { error, songPath });
      }
    }
  }
  return undefined;
};

export default saveLyricsToSong;

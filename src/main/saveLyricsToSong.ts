import path from 'path';
import NodeID3 from 'node-id3';

import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';
import { updateCachedLyrics } from './core/getSongLyrics';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import { appPreferences } from '../../package.json';
import log from './log';
import { dataUpdateEvent } from './main';
import saveLyricsToLRCFile from './core/saveLyricsToLrcFile';
import { getUserData } from './filesystem';

const { metadataEditingSupportedExtensions } = appPreferences;

type PendingSongLyrics = {
  title: string;
  synchronisedLyrics: SynchronisedLyrics;
  unsynchronisedLyrics: UnsynchronisedLyrics;
};

const pendingSongLyrics = new Map<string, PendingSongLyrics>();

const saveLyricsToSong = async (songPathWithProtocol: string, songLyrics: SongLyrics) => {
  const userData = getUserData();
  const songPath = removeDefaultAppProtocolFromFilePath(songPathWithProtocol);

  if (songLyrics && songLyrics.lyrics.parsedLyrics.length > 0) {
    const pathExt = path.extname(songPath).replace(/\W/, '');
    const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);

    if (!isASupportedFormat || userData.preferences.saveLyricsInLrcFilesForSupportedSongs)
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
              source: 'IN_SONG_LYRICS',
              isOfflineLyricsAvailable: true
            };
          return undefined;
        });
        return log(
          `Lyrics for '${songLyrics.title}' will be saved automatically.`,
          {
            songPath
          },
          'INFO',
          {
            sendToRenderer: {
              messageCode: 'LYRICS_SAVE_QUEUED',
              data: { title: songLyrics.title }
            }
          }
        );
      } catch (error) {
        log(`FAILED TO UPDATE THE SONG FILE WITH THE NEW UPDATES. `, { error }, 'ERROR');
        throw error;
      }
    } else {
      return log(
        `Lyrics for this song with '${pathExt}' extension will be saved in a LRC file.`,
        { songPath },
        'WARN',
        {
          sendToRenderer: {
            messageCode: 'LYRICS_SAVED_IN_LRC_FILE',
            data: { ext: pathExt }
          }
        }
      );
    }
  }

  throw new Error('no lyrics found to be saved to the song.');
};

export const isLyricsSavePending = (songPath: string) => pendingSongLyrics.has(songPath);

export const savePendingSongLyrics = (currentSongPath = '', forceSave = false) => {
  if (pendingSongLyrics.size === 0) return log('No pending song lyrics found.');

  log(`Started saving pending song lyrics.`, {
    pendingSongs: pendingSongLyrics.keys
  });

  const entries = pendingSongLyrics.entries();

  for (const [songPath, updatingTags] of entries) {
    const isACurrentlyPlayingSong = songPath === currentSongPath;

    if (forceSave || !isACurrentlyPlayingSong) {
      try {
        NodeID3.update(updatingTags, songPath);

        log(`Successfully saved pending lyrics of '${updatingTags.title}'.`, { songPath }, 'INFO', {
          sendToRenderer: {
            messageCode: 'PENDING_LYRICS_SAVED',
            data: { title: updatingTags.title }
          }
        });
        dataUpdateEvent('songs/lyrics');
        pendingSongLyrics.delete(songPath);
      } catch (error) {
        log(`Failed to save pending song lyrics of a song. `, { error, songPath }, 'ERROR');
        throw error;
      }
    }
  }
  return undefined;
};

export default saveLyricsToSong;

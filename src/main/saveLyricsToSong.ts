import fs from 'fs/promises';
import path from 'path';
import NodeID3 from 'node-id3';

import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';
import { updateCachedLyrics } from './core/getSongLyrics';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import { appPreferences } from '../../package.json';
import log from './log';
import { dataUpdateEvent } from './main';
import convertLyricsToLrcFormat from './utils/convertLyricsToLrcFormat';

const { metadataEditingSupportedExtensions } = appPreferences;

type PendingSongLyrics = {
  synchronisedLyrics: SynchronisedLyrics;
  unsynchronisedLyrics: UnsynchronisedLyrics;
};

const pendingSongLyrics = new Map<string, PendingSongLyrics>();

const saveLyricsToLRCFile = async (
  songPathWithoutProtocol: string,
  songLyrics: SongLyrics,
) => {
  const songContainingFolderPath = path.dirname(songPathWithoutProtocol);
  const songFileName = path.basename(songPathWithoutProtocol);
  const lrcFilePath = path.join(
    songContainingFolderPath,
    `${songFileName}.lrc`,
  );
  const lrcFormattedLyrics = convertLyricsToLrcFormat(songLyrics);

  await fs.writeFile(lrcFilePath, lrcFormattedLyrics);
  log(`Lyrics saved in ${lrcFilePath}.`, { title: songLyrics.title });
};

const saveLyricsToSong = async (
  songPathWithProtocol: string,
  lyrics: SongLyrics,
) => {
  const songPath = removeDefaultAppProtocolFromFilePath(songPathWithProtocol);

  if (lyrics && lyrics?.lyrics) {
    const pathExt = path.extname(songPath).replace(/\W/, '');
    const isASupporedFormat =
      metadataEditingSupportedExtensions.includes(pathExt);

    if (isASupporedFormat) {
      const prevTags = await NodeID3.Promise.read(songPath);

      const { isSynced } = lyrics.lyrics;
      const unsynchronisedLyrics: UnsynchronisedLyrics = !isSynced
        ? {
            language: 'ENG',
            text: lyrics.lyrics.unparsedLyrics,
          }
        : prevTags.unsynchronisedLyrics;

      const synchronisedLyrics = isSynced
        ? convertParsedLyricsToNodeID3Format(lyrics.lyrics)
        : prevTags.synchronisedLyrics;

      try {
        const updatingTags = {
          unsynchronisedLyrics,
          synchronisedLyrics: synchronisedLyrics || [],
        };
        // Kept to be saved later
        pendingSongLyrics.set(songPath, updatingTags);

        updateCachedLyrics((prevLyrics) => {
          if (prevLyrics)
            return {
              ...prevLyrics,
              source: 'IN_SONG_LYRICS',
              isOfflineLyricsAvailable: true,
            };
          return undefined;
        });
        return log(
          `Lyrics for '${lyrics.title}' will be saved automatically.`,
          {
            songPath,
          },
          'INFO',
          { sendToRenderer: 'SUCCESS' },
        );
      } catch (error) {
        log(
          `FAILED TO UPDATE THE SONG FILE WITH THE NEW UPDATES. `,
          { error },
          'ERROR',
        );
        throw error;
      }
    } else {
      saveLyricsToLRCFile(songPath, lyrics);
      return log(
        `Lyrics for this song with '${pathExt}' extension will be saved in a LRC file.`,
        { songPath },
        'WARN',
        { sendToRenderer: 'INFO' },
      );
    }
  }

  throw new Error('no lyrics found to be saved to the song.');
};

export const isLyricsSavePending = (songPath: string) =>
  pendingSongLyrics.has(songPath);

export const savePendingSongLyrics = (
  currentSongPath = '',
  forceSave = false,
) => {
  if (pendingSongLyrics.size === 0) return log('No pending song lyrics found.');

  log(`Started saving pending song lyrics.`, {
    pendingSongs: pendingSongLyrics.keys,
  });

  const entries = pendingSongLyrics.entries();

  for (const [songPath, updatingTags] of entries) {
    const isACurrentlyPlayingSong = songPath === currentSongPath;

    if (forceSave || !isACurrentlyPlayingSong) {
      try {
        NodeID3.update(updatingTags, songPath);

        log(`Successfully saved pending song lyrics of song.`, { songPath });
        dataUpdateEvent('songs/lyrics');
        pendingSongLyrics.delete(songPath);
      } catch (error) {
        log(
          `Failed to save pending song lyrics of a song. `,
          { error, songPath },
          'ERROR',
        );
        throw error;
      }
    }
  }
  return undefined;
};

export default saveLyricsToSong;

import NodeID3 from 'node-id3';
import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';
import { updateCachedLyrics } from './core/getSongLyrics';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import log from './log';

type PendingSongLyrics = {
  synchronisedLyrics: SynchronisedLyrics;
  unsynchronisedLyrics: UnsynchronisedLyrics;
};

const pendingSongLyrics = new Map<string, PendingSongLyrics>();

const saveLyricsToSong = async (
  songPathWithProtocol: string,
  lyrics: SongLyrics,
) => {
  const songPath = removeDefaultAppProtocolFromFilePath(songPathWithProtocol);
  const prevTags = await NodeID3.Promise.read(songPath);

  if (lyrics && lyrics?.lyrics) {
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
        `Lyrics for '${lyrics.title}' will be saved successfully.`,
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
  }

  throw new Error('no lyrics found to be saved to the song.');
};

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
        NodeID3.update(updatingTags, songPath, {
          include: [
            'SYLT', // 'synchronisedLyrics' = 'SYLT',
            'USLT', // 'unsynchronisedLyrics' = 'USLT',
          ],
        });

        log(`Successfully saved pending song lyrics of song.`, { songPath });
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

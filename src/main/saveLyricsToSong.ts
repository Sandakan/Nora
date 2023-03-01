import NodeID3 from 'node-id3';
import path from 'path';
import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';
import { updateCachedLyrics } from './core/getSongLyrics';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import log from './log';

const saveLyricsToSong = async (
  songPathWithProtocol: string,
  lyrics: SongLyrics
) => {
  const songPath = removeDefaultAppProtocolFromFilePath(songPathWithProtocol);
  if (lyrics && lyrics?.lyrics) {
    const { isSynced } = lyrics.lyrics;
    const unsynchronisedLyrics = !isSynced
      ? {
          language: 'ENG',
          text: lyrics.lyrics.unparsedLyrics,
        }
      : undefined;

    const synchronisedLyrics = isSynced
      ? convertParsedLyricsToNodeID3Format(lyrics.lyrics)
      : undefined;

    try {
      await NodeID3.Promise.update(
        {
          unsynchronisedLyrics,
          synchronisedLyrics: synchronisedLyrics || [],
        },
        songPath
      );
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
        `Updated lyrics on '${path.basename(songPath)}' successfully.`
      );
    } catch (error) {
      log(
        `FAILED TO UPDATE THE SONG FILE WITH THE NEW UPDATES. `,
        { error },
        'ERROR'
      );
      throw error;
    }
  }

  throw new Error('no lyrics found to be saved to the song.');
};

export default saveLyricsToSong;

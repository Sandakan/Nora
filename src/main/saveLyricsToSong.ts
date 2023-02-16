import NodeID3 from 'node-id3';
import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';
import { updateCachedLyrics } from './core/getSongLyrics';
import { getSongsData } from './filesystem';
import log from './log';

const saveLyricsToSong = async (songId: string, lyrics: SongLyrics) => {
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

    const songsData = getSongsData();

    for (let i = 0; i < songsData.length; i += 1) {
      const song = songsData[i];
      if (song.songId === songId) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await NodeID3.Promise.update(
            { unsynchronisedLyrics, synchronisedLyrics },
            song.path
          );
          updateCachedLyrics((prevLyrics) => {
            if (prevLyrics)
              return {
                ...prevLyrics,
                source: 'in_song_lyrics',
              };
            return undefined;
          });
          return log(`Updated lyrics on ${songId} successfully.`);
        } catch (error) {
          log(
            `FAILED TO UPDATE THE SONG FILE WITH THE NEW UPDATES. `,
            { error },
            'ERROR'
          );
          throw error;
        }
      }
    }
  }

  throw new Error('no lyrics found to be saved to the song.');
};

export default saveLyricsToSong;

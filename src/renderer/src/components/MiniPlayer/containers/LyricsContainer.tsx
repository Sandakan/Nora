/* eslint-disable react/no-array-index-key */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../../contexts/AppContext';

import LyricLine from '../../LyricsPage/LyricLine';

type Props = { isLyricsVisible: boolean };

const LyricsContainer = (props: Props) => {
  const { currentSongData, isCurrentSongPlaying } = React.useContext(AppContext);
  const { t } = useTranslation();

  const { isLyricsVisible } = props;

  const [lyrics, setLyrics] = React.useState<SongLyrics | null | undefined>(null);

  React.useEffect(() => {
    if (isLyricsVisible) {
      setLyrics(null);
      window.api.lyrics
        .getSongLyrics({
          songTitle: currentSongData.title,
          songArtists: Array.isArray(currentSongData.artists)
            ? currentSongData.artists.map((artist) => artist.name)
            : [],
          songPath: currentSongData.path,
          duration: currentSongData.duration
        })
        .then((res) => setLyrics(res))
        .catch((err) => console.error(err));
    }
  }, [
    currentSongData.artists,
    currentSongData.duration,
    currentSongData.path,
    currentSongData.songId,
    currentSongData.title,
    isLyricsVisible
  ]);

  const lyricsComponents = React.useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { isSynced, lyrics: unsyncedLyrics, syncedLyrics, offset = 0 } = lyrics.lyrics;

      if (syncedLyrics) {
        const syncedLyricsLines = syncedLyrics.map((lyric, index) => {
          const { text, end, start } = lyric;
          return <LyricLine key={index} index={index} lyric={text} syncedLyrics={{ start, end }} />;
        });

        const firstLine = (
          <LyricLine
            key="..."
            index={0}
            lyric="•••"
            syncedLyrics={{
              start: 0,
              end: (syncedLyrics[0]?.start || 0) + offset
            }}
          />
        );

        if ((syncedLyrics[0]?.start || 0) !== 0) syncedLyricsLines.unshift(firstLine);

        return syncedLyricsLines;
      }
      if (!isSynced) {
        return unsyncedLyrics.map((line, index) => {
          return <LyricLine key={index} index={index} lyric={line} />;
        });
      }
    }
    return [];
  }, [lyrics]);

  return (
    <div
      className={`mini-player-lyrics-container absolute top-0 flex h-full w-full select-none flex-col items-center overflow-hidden px-4 py-12 transition-[filter] group-focus-within:blur-sm group-focus-within:brightness-50 group-hover:blur-sm group-hover:brightness-50 ${
        !isCurrentSongPlaying ? 'blur-sm brightness-50' : ''
      }`}
      id="miniPlayerLyricsContainer"
    >
      {isLyricsVisible &&
        lyricsComponents.length > 0 &&
        lyrics &&
        lyrics.lyrics.isSynced &&
        lyricsComponents}
      {isLyricsVisible && lyrics && !lyrics.lyrics.isSynced && (
        <div className="flex h-full w-full items-center justify-center text-font-color-white opacity-75">
          {t('lyricsPage.noSyncedLyrics')}
        </div>
      )}
      {isLyricsVisible && lyrics === undefined && (
        <div className="flex h-full w-full items-center justify-center text-font-color-white">
          {t('lyricsPage.noLyrics')}
        </div>
      )}
    </div>
  );
};

export default LyricsContainer;

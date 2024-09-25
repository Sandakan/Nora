/* eslint-disable react/no-array-index-key */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LyricsMetadata from '../../LyricsPage/LyricsMetadata';
import LyricLine from '../../LyricsPage/LyricLine';
import useSkipLyricsLines from '../../../hooks/useSkipLyricsLines';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = {
  isLyricsVisible: boolean;
  setIsLyricsAvailable: (state: boolean) => void;
};

const LyricsContainer = (props: Props) => {
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const currentSongData = useStore(store, (state) => state.currentSongData);

  const { isLyricsVisible, setIsLyricsAvailable } = props;
  const { t } = useTranslation();

  const [lyrics, setLyrics] = useState<SongLyrics | null | undefined>(null);
  useSkipLyricsLines(lyrics);

  useEffect(() => {
    if (isLyricsVisible) {
      setLyrics(null);
      window.api.lyrics
        .getSongLyrics({
          songTitle: currentSongData.title,
          songArtists: Array.isArray(currentSongData.artists)
            ? currentSongData.artists.map((artist) => artist.name)
            : [],
          album: currentSongData.album?.name,
          songPath: currentSongData.path,
          duration: currentSongData.duration
        })
        .then((res) => {
          setIsLyricsAvailable(res?.lyrics?.isSynced ?? false);
          return setLyrics(res);
        })
        .catch((err) => console.error(err));
    }
  }, [
    currentSongData.album?.name,
    currentSongData.artists,
    currentSongData.duration,
    currentSongData.path,
    currentSongData.songId,
    currentSongData.title,
    isLyricsVisible,
    setIsLyricsAvailable
  ]);

  const lyricsComponents = useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { isSynced, parsedLyrics, offset = 0 } = lyrics.lyrics;

      if (isSynced) {
        const syncedLyricsLines = parsedLyrics.map((lyric, index) => {
          const { originalText: text, end = 0, start = 0 } = lyric;
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={text}
              syncedLyrics={{ start, end }}
              translatedLyricLines={lyric.translatedTexts}
              convertedLyric={lyric.convertedLyrics}
            />
          );
        });

        const firstLine = (
          <LyricLine
            key="..."
            index={0}
            lyric="•••"
            syncedLyrics={{
              start: 0,
              end: (parsedLyrics[0]?.start || 0) + offset
            }}
          />
        );

        if ((parsedLyrics[0]?.start || 0) !== 0) syncedLyricsLines.unshift(firstLine);

        return syncedLyricsLines;
      }
      if (!isSynced) {
        return parsedLyrics.map((line, index) => {
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={line.originalText}
              translatedLyricLines={line.translatedTexts}
              convertedLyric={line.convertedLyrics}
            />
          );
        });
      }
    }
    return [];
  }, [lyrics]);

  const lyricsSource = useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { source, link } = lyrics;

      return (
        <LyricsMetadata
          source={source}
          copyright={lyrics.lyrics.copyright}
          link={link}
          className="!items-start !text-left"
        />
      );
    }
    return undefined;
  }, [lyrics]);

  return (
    <div
      className={`mini-player-lyrics-container appear-from-bottom w-ful absolute top-0 flex h-full !max-h-screen w-full !max-w-full select-none flex-col items-start overflow-auto pb-[25%] pl-20 pr-[20%] pt-20 transition-[filter] delay-200 group-focus-within/fullScreenPlayer:blur-sm group-focus-within:brightness-50 group-hover/fullScreenPlayer:blur-sm group-hover/fullScreenPlayer:brightness-50 ${
        !isCurrentSongPlaying ? 'blur-sm brightness-50' : ''
      }`}
      id="miniPlayerLyricsContainer"
    >
      {isLyricsVisible && lyricsComponents.length > 0 && lyrics && lyrics.lyrics.isSynced && (
        <>
          {lyricsComponents}
          {lyricsSource}
        </>
      )}
      {isLyricsVisible && lyrics && !lyrics.lyrics.isSynced && (
        <div className="flex h-full w-full flex-col justify-center text-2xl text-font-color-highlight opacity-50">
          <span className="material-icons-round-outlined mb-2 text-5xl">brightness_alert</span>
          {t('lyricsPage.noSyncedLyrics')}
          <p className="mt-4 text-base">{t('lyricsPage.noSyncedLyricsDescription')}</p>
        </div>
      )}
      {isLyricsVisible && lyrics === undefined && (
        <div className="flex h-full w-full flex-col justify-center text-2xl text-font-color-highlight opacity-50">
          <span className="material-icons-round-outlined mb-2 text-5xl">brightness_alert</span>
          <p>{t('lyricsPage.noLyrics')}</p>
          <p className="mt-4 text-base">{t('lyricsPage.noLyricsDescription')}</p>
        </div>
      )}
    </div>
  );
};

export default LyricsContainer;

import { lyricsQuery } from '@renderer/queries/lyrics';
import { store } from '@renderer/store/store';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import useSkipLyricsLines from '../../../hooks/useSkipLyricsLines';
import i18n from '../../../i18n';
import LyricLine from '../../LyricsPage/LyricLine';
import LyricsMetadata from '../../LyricsPage/LyricsMetadata';

type Props = {
  isLyricsVisible: boolean;
  setIsLyricsAvailable: (state: boolean) => void;
  isShowLyricsWithSongInfo?: boolean;
};

const LyricsContainer = (props: Props) => {
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { isLyricsVisible, setIsLyricsAvailable, isShowLyricsWithSongInfo } = props;
  const { t } = useTranslation();

  const { data: lyrics } = useQuery({
    ...lyricsQuery.fullScreenPlayer({
      title: currentSongData.title,
      artists: Array.isArray(currentSongData.artists)
        ? currentSongData.artists.map((artist) => artist.name)
        : [],
      album: currentSongData.album?.name,
      path: currentSongData.path,
      duration: currentSongData.duration,
      language: i18n.language,
      autoTranslate: !!preferences.autoTranslateLyrics,
      autoConvert: !!preferences.autoConvertLyrics
    }),
    enabled: isLyricsVisible
  });

  useSkipLyricsLines(lyrics ?? null);

  useEffect(() => {
    setIsLyricsAvailable(!!lyrics?.lyrics?.isSynced);
  }, [lyrics, setIsLyricsAvailable]);

  const lyricsComponents = useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { isSynced, parsedLyrics, offset = 0 } = lyrics.lyrics;

      if (isSynced) {
        const syncedLyricsLines = parsedLyrics.map((lyric, index) => {
          const { originalText: text, end = 0, start = 0 } = lyric;
          return (
            <LyricLine
              playerType="full"
              key={index}
              index={index}
              lyric={text}
              syncedLyrics={{ start, end }}
              translatedLyricLines={lyric.translatedTexts}
              convertedLyric={lyric.romanizedText}
            />
          );
        });

        const firstLine = (
          <LyricLine
            playerType="full"
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
              playerType="full"
              key={index}
              index={index}
              lyric={line.originalText}
              translatedLyricLines={line.translatedTexts}
              convertedLyric={line.romanizedText}
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
          className="items-start! text-left!"
        />
      );
    }
    return undefined;
  }, [lyrics]);

  return (
    <div
      className={`mini-player-lyrics-container appear-from-bottom ${
        isShowLyricsWithSongInfo
          ? 'relative flex h-full w-full flex-col items-start py-4 pr-4 pl-4'
          : 'absolute top-0 flex h-full max-h-screen! w-full max-w-full! flex-col items-start overflow-auto pt-20 pr-[20%] pb-[25%] pl-20'
      } transition-[filter] delay-200 select-none ${
        !isShowLyricsWithSongInfo
          ? 'group-focus-within:brightness-50 group-focus-within/fullScreenPlayer:blur-xs group-hover/fullScreenPlayer:blur-xs group-hover/fullScreenPlayer:brightness-50'
          : ''
      } ${
        !isCurrentSongPlaying && !isShowLyricsWithSongInfo ? 'blur-xs brightness-50' : ''
      }`}
      id="miniPlayerLyricsContainer"
    >
      {(isShowLyricsWithSongInfo || isLyricsVisible) && lyricsComponents.length > 0 && lyrics && lyrics.lyrics.isSynced && (
        <>
          {lyricsComponents}
          {lyricsSource}
        </>
      )}
      {(isShowLyricsWithSongInfo || isLyricsVisible) && lyrics && !lyrics.lyrics.isSynced && (
        <div className="text-font-color-highlight flex h-full w-full flex-col justify-center text-2xl opacity-50">
          <span className="material-icons-round-outlined mb-2 text-5xl">brightness_alert</span>
          {t('lyricsPage.noSyncedLyrics')}
          <p className="mt-4 text-base">{t('lyricsPage.noSyncedLyricsDescription')}</p>
        </div>
      )}
      {(isShowLyricsWithSongInfo || isLyricsVisible) && !lyrics && (
        <div className="text-font-color-highlight flex h-full w-full flex-col justify-center text-2xl opacity-50">
          <span className="material-icons-round-outlined mb-2 text-5xl">brightness_alert</span>
          <p>{t('lyricsPage.noLyrics')}</p>
          <p className="mt-4 text-base">{t('lyricsPage.noLyricsDescription')}</p>
        </div>
      )}
    </div>
  );
};

export default LyricsContainer;

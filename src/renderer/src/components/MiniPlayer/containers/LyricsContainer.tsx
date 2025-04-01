import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

import LyricLine from '../../LyricsPage/LyricLine';
import useSkipLyricsLines from '../../../hooks/useSkipLyricsLines';
import LyricsMetadata from '../../LyricsPage/LyricsMetadata';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = { isLyricsVisible: boolean };

const LyricsContainer = (props: Props) => {
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { t } = useTranslation();

  const { isLyricsVisible } = props;

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
        .then(async (res) => {
          setLyrics(res);

          if (
            preferences.autoTranslateLyrics &&
            !res?.lyrics.isReset &&
            !res?.lyrics.isTranslated
          ) {
            setLyrics(await window.api.lyrics.getTranslatedLyrics(i18n.language as LanguageCodes));
          }
          if (preferences.autoConvertLyrics && !res?.lyrics.isReset && !res?.lyrics.isRomanized) {
            if (res?.lyrics.originalLanguage == 'zh')
              setLyrics(await window.api.lyrics.convertLyricsToPinyin());
            else if (res?.lyrics.originalLanguage == 'ja')
              setLyrics(await window.api.lyrics.romanizeLyrics());
            else if (res?.lyrics.originalLanguage == 'ko')
              setLyrics(await window.api.lyrics.convertLyricsToRomaja());
          }
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
    preferences.autoTranslateLyrics,
    preferences.autoConvertLyrics,
    isLyricsVisible
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
              convertedLyric={lyric.romanizedText}
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
          className="!mt-2"
          textClassName="!text-xs"
        />
      );
    }
    return undefined;
  }, [lyrics]);

  return (
    <div
      className={`mini-player-lyrics-container absolute top-0 flex h-full w-full select-none flex-col items-center overflow-hidden px-4 py-12 transition-[filter] group-focus-within:blur-sm group-focus-within:brightness-50 group-hover:blur-sm group-hover:brightness-50 ${
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

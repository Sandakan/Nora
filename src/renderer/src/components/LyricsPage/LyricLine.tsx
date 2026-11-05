/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { SYNCED_LYRICS_REGEX } from '@common/isLyricsSynced';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import roundTo from '../../../../common/roundTo';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { getPlayer } from '../../hooks/useAudioPlayer';
import EnhancedSyncedLyricWord from '../LyricsEditingPage/EnhancedSyncedLyricWord';
import LyricsProgressBar from './LyricsProgressBar';

interface LyricProp {
  lyric: string | SyncedLyricsLineWord[];
  translatedLyricLines?: TranslatedLyricLine[];
  convertedLyric?: string | SyncedLyricsLineWord[];
  index: number;
  syncedLyrics?: { start: number; end: number };
  isAutoScrolling?: boolean;
  playerType?: PlayerTypes;
  isActive?: boolean;
}

const lyricsScrollIntoViewEvent = new CustomEvent('lyrics/scrollIntoView', {
  detail: 'scrollingUsingScrollIntoView'
});

const getLyricText = (lyrics: string) => {
  const match = SYNCED_LYRICS_REGEX.exec(lyrics);
  SYNCED_LYRICS_REGEX.lastIndex = 0;

  if (match && match.groups && match.groups.lyric) return match.groups.lyric.trim();
  return lyrics;
};

const LyricLine = (props: LyricProp) => {
  const { updateSongPosition, updateContextMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const {
    index,
    lyric,
    translatedLyricLines = [],
    convertedLyric,
    syncedLyrics,
    isAutoScrolling = true,
    playerType = 'normal',
    isActive: isActiveProp
  } = props;

  const [isInRangeLocal, setIsInRangeLocal] = useState(false);
  const lyricsRef = useRef(null as HTMLDivElement | null);
  const isTheCurrentLineRef = useRef(false);

  // If isActiveProp is provided (boolean), use it; otherwise fall back to local event-driven state
  const isLineActive = typeof isActiveProp === 'boolean' ? isActiveProp : isInRangeLocal;

  // Active word tracking for enhanced synced lyrics (karaoke)
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const activeWordIndexRef = useRef<number>(-1);

  // When using centralized isActiveProp: auto-scroll when line becomes active
  useEffect(() => {
    if (typeof isActiveProp === 'boolean' && isActiveProp) {
      if (isAutoScrolling) {
        lyricsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      document.dispatchEvent(lyricsScrollIntoViewEvent);
    }
  }, [isActiveProp, isAutoScrolling]);

  // Fallback listener for when isActiveProp is not provided
  const handleLyricsActivity = useCallback(
    (e: Event) => {
      if ('detail' in e && !Number.isNaN(e.detail)) {
        const songPosition = e.detail as number;

        if (lyricsRef.current && syncedLyrics) {
          const { start, end } = syncedLyrics;
          if (songPosition > start && songPosition < end) {
            if (!isTheCurrentLineRef.current) {
              isTheCurrentLineRef.current = true;
              setIsInRangeLocal(true);
              if (isAutoScrolling)
                lyricsRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });

              document.dispatchEvent(lyricsScrollIntoViewEvent);
            }
          } else {
            isTheCurrentLineRef.current = false;
            setIsInRangeLocal(false);
          }
        }
      }
    },
    [isAutoScrolling, syncedLyrics]
  );

  useEffect(() => {
    if (typeof isActiveProp === 'boolean') {
      return undefined;
    }
    document.addEventListener('player/positionChange', handleLyricsActivity);
    return () => document.removeEventListener('player/positionChange', handleLyricsActivity);
  }, [handleLyricsActivity, isActiveProp]);

  // Word-level 60 FPS karaoke tracking when line is active and contains words
  useEffect(() => {
    const hasWords =
      Array.isArray(lyric) ||
      (translatedLyricLines.length > 0 && Array.isArray(translatedLyricLines[0].text)) ||
      (convertedLyric && Array.isArray(convertedLyric));

    if (!isLineActive || !hasWords) {
      setActiveWordIndex(-1);
      activeWordIndexRef.current = -1;
      return undefined;
    }

    const player = getPlayer();
    let animId: number | null = null;

    // Get the word list to track timing
    const words: SyncedLyricsLineWord[] = Array.isArray(lyric)
      ? lyric
      : translatedLyricLines.length > 0 && Array.isArray(translatedLyricLines[0].text)
        ? (translatedLyricLines[0].text as SyncedLyricsLineWord[])
        : Array.isArray(convertedLyric)
          ? convertedLyric
          : [];

    const updateActiveWord = () => {
      const currentTime = player.getExactCurrentTime();
      let foundWord = -1;
      for (let i = 0; i < words.length; i += 1) {
        const w = words[i];
        if (currentTime >= w.start && currentTime < w.end) {
          foundWord = i;
          break;
        }
      }
      if (foundWord !== activeWordIndexRef.current) {
        activeWordIndexRef.current = foundWord;
        setActiveWordIndex(foundWord);
      }
    };

    const loop = () => {
      updateActiveWord();
      animId = requestAnimationFrame(loop);
    };

    if (!player.paused) {
      animId = requestAnimationFrame(loop);
    }

    const onPlay = () => {
      if (animId === null) animId = requestAnimationFrame(loop);
    };
    const onPause = () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      updateActiveWord();
    };

    player.on('play', onPlay);
    player.on('pause', onPause);
    player.on('seeked', updateActiveWord);
    player.on('timeUpdate', updateActiveWord);

    updateActiveWord();

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      player.off('play', onPlay);
      player.off('pause', onPause);
      player.off('seeked', updateActiveWord);
      player.off('timeUpdate', updateActiveWord);
    };
  }, [convertedLyric, isLineActive, lyric, translatedLyricLines]);

  const lyricString = useMemo(() => {
    if (typeof lyric === 'string') return getLyricText(lyric);

    const extendedLyricLines = lyric.map((extendedText, i) => {
      return (
        <EnhancedSyncedLyricWord
          key={i}
          isActive={isLineActive}
          isWordActive={isLineActive ? i === activeWordIndex : false}
          start={extendedText.start}
          end={extendedText.end}
          text={extendedText.text}
          delay={0}
        />
      );
    });

    return extendedLyricLines;
  }, [activeWordIndex, isLineActive, lyric]);

  const translatedLyricString = useMemo(() => {
    if (translatedLyricLines.length === 0) return undefined;

    const translatedLyric = translatedLyricLines[0].text;
    if (typeof translatedLyric === 'string') return getLyricText(translatedLyric);

    const extendedLyricLines = translatedLyric.map((extendedText, i) => {
      return (
        <EnhancedSyncedLyricWord
          key={i}
          isActive={isLineActive}
          isWordActive={isLineActive ? i === activeWordIndex : false}
          start={extendedText.start}
          end={extendedText.end}
          text={extendedText.text}
          delay={0}
        />
      );
    });

    return extendedLyricLines;
  }, [activeWordIndex, isLineActive, translatedLyricLines]);

  const convertedLyricString = useMemo(() => {
    if (!convertedLyric || convertedLyric.length === 0) return undefined;
    if (typeof convertedLyric === 'string') return getLyricText(convertedLyric);

    const extendedLyricLines = convertedLyric.map((extendedText, i) => {
      return (
        <EnhancedSyncedLyricWord
          key={i}
          isActive={isLineActive}
          isWordActive={isLineActive ? i === activeWordIndex : false}
          start={extendedText.start}
          end={extendedText.end}
          text={extendedText.text}
          delay={0}
        />
      );
    });

    return extendedLyricLines;
  }, [activeWordIndex, convertedLyric, isLineActive]);

  const lyricStringLinePrimary = translatedLyricString ?? convertedLyricString ?? lyricString;
  let lyricStringLineSecondaryUpper;
  if (translatedLyricString) lyricStringLineSecondaryUpper = convertedLyricString ?? lyricString;

  return (
    <div
      style={{
        animationDelay: `${100 + 20 * (index + 1)}ms`
      }}
      title={
        syncedLyrics
          ? t(`lyricsEditingPage.fromTo`, {
              start: roundTo(syncedLyrics.start, 2),
              end: roundTo(syncedLyrics.end, 2)
            })
          : undefined
      }
      className={`highlight text-font-color-black/20 dark:text-font-color-white/20 z-0 mb-5 flex w-fit flex-col items-center justify-center text-center text-5xl font-medium text-balance transition-[transform,translate,scale,color,filter] duration-250 select-none first:mt-8 last:mb-4 empty:mb-16 ${
        syncedLyrics
          ? `cursor-pointer blur-[1px] ${
              isLineActive
                ? 'text-font-color-highlight! dark:text-dark-font-color-highlight! scale-100! font-medium blur-none! [&>div>span]:mr-3!'
                : 'scale-75!'
            }`
          : 'text-font-color-black! dark:text-font-color-white! scale-100! text-4xl! font-medium blur-none! [&>div>span]:mr-3'
      } ${playerType === 'mini' ? 'text-font-color-white/20! mb-2! text-2xl!' : ''} ${playerType === 'full' ? 'text-font-color-white/20! mb-6! origin-left items-start! justify-start! text-left! text-7xl!' : ''}`}
      ref={lyricsRef}
      onClick={() =>
        syncedLyrics &&
        (typeof lyric === 'string' || translatedLyricString) &&
        updateSongPosition(syncedLyrics.start)
      }
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(
          true,
          [
            {
              label: t('common.copy'),
              class: 'sync',
              iconName: 'content_copy',
              iconClassName: 'material-icons-round-outlined',
              handlerFunction: () =>
                window.navigator.clipboard.writeText(
                  typeof lyric === 'string'
                    ? getLyricText(lyric)
                    : lyric.map((x) => x.text).join(' ')
                )
            }
          ],
          e.pageX,
          e.pageY
        );
      }}
    >
      {lyricStringLineSecondaryUpper && (
        <div
          className={`flex flex-row flex-wrap ${playerType !== 'full' ? 'items-center justify-center' : ''} ${syncedLyrics && isLineActive ? 'text-font-color-black/50! dark:text-font-color-white/50! text-xl!' : 'text-xl!'}`}
        >
          {lyricStringLineSecondaryUpper}
        </div>
      )}
      <div
        className={`flex flex-row flex-wrap ${playerType !== 'full' ? 'items-center justify-center' : ''}`}
      >
        {lyricStringLinePrimary}
      </div>
      {syncedLyrics && isLineActive && <LyricsProgressBar delay={0} syncedLyrics={syncedLyrics} />}
    </div>
  );
};

export default LyricLine;

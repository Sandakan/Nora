/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import roundTo from '../../../../common/roundTo';
import { delay, syncedLyricsRegex } from './LyricsPage';
import LyricsProgressBar from './LyricsProgressBar';
import EnhancedSyncedLyricWord from '../LyricsEditingPage/EnhancedSyncedLyricWord';

interface LyricProp {
  lyric: string | SyncedLyricsLineText;
  index: number;
  syncedLyrics?: { start: number; end: number };
  isAutoScrolling?: boolean;
}

const lyricsScrollIntoViewEvent = new CustomEvent('lyrics/scrollIntoView', {
  detail: 'scrollingUsingScrollIntoView'
});

const LyricLine = (props: LyricProp) => {
  const { playerType } = React.useContext(AppContext);
  const { updateSongPosition } = React.useContext(AppUpdateContext);
  const [isInRange, setIsInRange] = React.useState(false);
  const { t } = useTranslation();

  const lyricsRef = React.useRef(null as HTMLDivElement | null);
  const isTheCurrnetLineRef = React.useRef(false);

  const { index, lyric, syncedLyrics, isAutoScrolling = true } = props;

  const handleLyricsActivity = React.useCallback(
    (e: Event) => {
      if ('detail' in e && !Number.isNaN(e.detail)) {
        const songPosition = e.detail as number;

        if (lyricsRef.current && syncedLyrics) {
          const { start, end } = syncedLyrics;
          if (songPosition > start - delay && songPosition < end - delay) {
            if (!isTheCurrnetLineRef.current) {
              isTheCurrnetLineRef.current = true;
              setIsInRange(true);
              if (isAutoScrolling)
                lyricsRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });

              document.dispatchEvent(lyricsScrollIntoViewEvent);
            }
          } else {
            isTheCurrnetLineRef.current = false;
            setIsInRange(false);
          }
        }
      }
    },
    [isAutoScrolling, syncedLyrics]
  );

  React.useEffect(() => {
    document.addEventListener('player/positionChange', handleLyricsActivity);

    return () => document.removeEventListener('player/positionChange', handleLyricsActivity);
  }, [handleLyricsActivity]);

  const lyricString = React.useMemo(() => {
    if (typeof lyric === 'string') return lyric.replaceAll(syncedLyricsRegex, '').trim();

    const extendedLyricLines = lyric.map((extendedText, i) => {
      return (
        <EnhancedSyncedLyricWord
          key={i}
          isActive={isInRange}
          start={extendedText.start}
          end={extendedText.end}
          text={extendedText.text}
          delay={delay}
        />
      );
    });

    return extendedLyricLines;
  }, [isInRange, lyric]);

  return (
    <div
      style={{
        animationDelay: `${100 + 20 * (index + 1)}ms`
      }}
      title={
        syncedLyrics
          ? t(`lyricsEditingPage.fromTo`, {
              start: roundTo(syncedLyrics.start - delay, 2),
              end: roundTo(syncedLyrics.end - delay, 2)
            })
          : undefined
      }
      className={`highlight duration-250 mb-5 flex w-fit select-none flex-col items-center justify-center text-balance text-center text-5xl font-medium text-font-color-black transition-[transform,color,filter] first:mt-8 last:mb-4 empty:mb-16 dark:text-font-color-white ${
        syncedLyrics
          ? `cursor-pointer ${
              isInRange
                ? '!scale-100 text-font-color-highlight !text-opacity-90 !blur-0 dark:!text-dark-font-color-highlight [&>div>span]:!mr-3'
                : 'scale-[.7] !text-opacity-20 hover:!text-opacity-75'
            }`
          : '!text-4xl'
      } ${playerType === 'mini' && '!mb-2 !text-2xl !text-font-color-white'} ${
        playerType === 'full' &&
        '!mb-6 origin-left !items-start !justify-start !text-left !text-6xl !text-font-color-white blur-[1px]'
      }`}
      ref={lyricsRef}
      onClick={() =>
        syncedLyrics && typeof lyric === 'string' && updateSongPosition(syncedLyrics.start)
      }
    >
      <div
        className={`flex flex-row flex-wrap ${playerType !== 'full' && 'items-center justify-center'}`}
      >
        {lyricString}
      </div>
      {syncedLyrics && isInRange && <LyricsProgressBar delay={delay} syncedLyrics={syncedLyrics} />}
    </div>
  );
};

export default LyricLine;

/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import roundTo from 'renderer/utils/roundTo';
import { delay, syncedLyricsRegex } from './LyricsPage';

interface LyricProp {
  lyric: string | SyncedLyricsLineText;
  index: number;
  syncedLyrics?: { start: number; end: number };
  isAutoScrolling?: boolean;
}

const lyricsScrollIntoViewEvent = new CustomEvent('lyrics/scrollIntoView', {
  detail: 'scrollingUsingScrollIntoView',
});

const LyricLine = (props: LyricProp) => {
  const { playerType } = React.useContext(AppContext);
  const { songPosition } = React.useContext(SongPositionContext);
  const { updateSongPosition } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const lyricsRef = React.useRef(null as HTMLDivElement | null);
  const isTheCurrnetLineRef = React.useRef(false);

  const { index, lyric, syncedLyrics, isAutoScrolling = true } = props;

  React.useEffect(() => {
    if (lyricsRef.current && syncedLyrics) {
      const { start, end } = syncedLyrics;
      if (songPosition > start - delay && songPosition < end - delay) {
        if (!isTheCurrnetLineRef.current && isAutoScrolling) {
          isTheCurrnetLineRef.current = true;
          lyricsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          document.dispatchEvent(lyricsScrollIntoViewEvent);
        }
      } else isTheCurrnetLineRef.current = false;
    }
  }, [syncedLyrics, songPosition, isAutoScrolling]);

  const lyricString = React.useMemo(() => {
    if (typeof lyric === 'string')
      return lyric.replaceAll(syncedLyricsRegex, '').trim();

    const extendedLyricLines = lyric.map((extendedText, i) => {
      return (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={`${i}-${extendedText.text}`}
          onClick={() => updateSongPosition(extendedText.start)}
          className={`mr-2 text-font-color-black last:mr-0 dark:text-font-color-white ${
            songPosition > extendedText.start - delay &&
            songPosition < extendedText.end - delay
              ? '!text-opacity-90'
              : syncedLyrics &&
                  songPosition > syncedLyrics.start - delay &&
                  songPosition < syncedLyrics.end - delay
                ? '!text-opacity-50'
                : '!text-opacity-20 hover:!text-opacity-75'
          }`}
        >
          {extendedText.text}
        </span>
      );
    });

    return extendedLyricLines;
  }, [lyric, songPosition, syncedLyrics, updateSongPosition]);

  const lyricDurationBarProperties: any = {};
  // eslint-disable-next-line dot-notation
  lyricDurationBarProperties['--duration'] = syncedLyrics
    ? songPosition < syncedLyrics.start - delay
      ? '0%'
      : songPosition > syncedLyrics.end - delay
        ? '100%'
        : `${
            ((songPosition - (syncedLyrics.start - delay)) /
              (syncedLyrics.end - delay - (syncedLyrics.start - delay))) *
            100
          }%`
    : '0%';

  return (
    <div
      style={{
        animationDelay: `${100 + 20 * (index + 1)}ms`,
      }}
      title={
        syncedLyrics
          ? t(`lyricsEditingPage.fromTo`, {
              start: roundTo(syncedLyrics.start - delay, 2),
              end: roundTo(syncedLyrics.end - delay, 2),
            })
          : undefined
      }
      className={`highlight duration-250 mb-5 flex w-fit select-none flex-col items-center justify-center text-balance text-center text-5xl font-medium text-font-color-black transition-[transform,color,filter] first:mt-8 last:mb-4 empty:mb-16 dark:text-font-color-white ${
        syncedLyrics
          ? `cursor-pointer ${
              songPosition > syncedLyrics.start - delay &&
              songPosition < syncedLyrics.end - delay
                ? '!scale-100 !text-opacity-90 !blur-0 [&>div>span]:!mr-3'
                : 'scale-[.7] !text-opacity-20 hover:!text-opacity-75'
            }`
          : '!text-4xl'
      } ${playerType === 'mini' && '!mb-2 !text-2xl !text-font-color-white'} ${
        playerType === 'full' &&
        '!mb-6 origin-left !items-start !justify-start !text-left !text-6xl !text-font-color-white blur-[1px]'
      }`}
      ref={lyricsRef}
      onClick={() =>
        syncedLyrics &&
        typeof lyric === 'string' &&
        updateSongPosition(syncedLyrics.start)
      }
    >
      <div
        className={`flex flex-row flex-wrap ${
          playerType !== 'full' && 'items-center justify-center'
        }`}
      >
        {lyricString}
      </div>
      <span
        style={lyricDurationBarProperties}
        className={`invisible mt-1 block h-1 w-1/2 min-w-[2rem] max-w-[4rem] rounded-md bg-background-color-2 opacity-0 transition-[visibility,opacity] dark:bg-dark-background-color-2 ${
          syncedLyrics &&
          songPosition > syncedLyrics.start - delay &&
          songPosition < syncedLyrics.end - delay &&
          '!visible !opacity-100 dark:!opacity-50'
        }`}
      >
        <span className="block h-full w-[var(--duration)] rounded-md bg-background-color-dimmed transition-[width] duration-300 dark:bg-background-color-dimmed" />
      </span>
    </div>
  );
};

export default LyricLine;

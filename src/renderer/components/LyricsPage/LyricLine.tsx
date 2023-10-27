/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
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
  const { isMiniPlayer } = React.useContext(AppContext);
  const { songPosition } = React.useContext(SongPositionContext);
  const { updateSongPosition } = React.useContext(AppUpdateContext);
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

    // const { start, end } = syncedLyrics!;
    const extendedLyricLines = lyric.map((x) => {
      return (
        <span
          key={x.text}
          className={`mr-2 text-font-color-black last:mr-0 dark:text-font-color-white ${
            songPosition > x.start - delay && songPosition < x.end - delay
              ? '!text-opacity-90'
              : // : songPosition > start - delay && songPosition < end - delay
                // ? '!text-opacity-40'
                '!text-opacity-20 hover:!text-opacity-75'
          }`}
        >
          {x.text}
        </span>
      );
    });

    return extendedLyricLines;
  }, [lyric, songPosition]);

  return (
    <div
      style={{
        animationDelay: `${100 + 20 * (index + 1)}ms`,
      }}
      title={
        syncedLyrics
          ? `${roundTo(syncedLyrics.start - delay, 2)} to ${roundTo(
              syncedLyrics.end - delay,
              2,
            )}`
          : undefined
      }
      className={`highlight [text-wrap:balance] mb-5 w-fit select-none text-center text-4xl font-medium text-font-color-black transition-[transform,color] duration-250 first:mt-8 last:mb-4 empty:mb-16 dark:text-font-color-white ${
        syncedLyrics
          ? `cursor-pointer ${
              songPosition > syncedLyrics.start - delay &&
              songPosition < syncedLyrics.end - delay
                ? '!scale-100 text-5xl !text-opacity-90'
                : '!scale-75 !text-opacity-20 hover:!text-opacity-75'
            }`
          : ''
      } ${isMiniPlayer && '!mb-2 !text-2xl !text-font-color-white'}`}
      ref={lyricsRef}
      onClick={() => syncedLyrics && updateSongPosition(syncedLyrics.start)}
    >
      {lyricString}
    </div>
  );
};

export default LyricLine;

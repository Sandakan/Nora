/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import roundTo from 'renderer/utils/roundTo';
import { syncedLyricsRegex } from './LyricsPage';

interface LyricProp {
  lyric: string;
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

  // substracted 350 milliseconds to keep lyrics in sync with the lyrics line animations.
  const delay = 0.35;

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

  const lyricString = React.useMemo(
    () => lyric.replaceAll(syncedLyricsRegex, '').trim(),
    [lyric]
  );

  return (
    <div
      style={{
        animationDelay: `${250 + 25 * (index + 1)}ms`,
      }}
      title={
        syncedLyrics
          ? `${lyricString} - ${roundTo(
              syncedLyrics.start - delay,
              2
            )} to ${roundTo(syncedLyrics.end - delay, 2)}`
          : undefined
      }
      className={`appear-from-bottom highlight mb-5 w-fit select-text text-center font-['Poppins'] text-4xl font-medium text-font-color-black transition-[color,transform] duration-200 first:mt-8 last:mb-4 empty:mb-16 dark:text-font-color-white ${
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

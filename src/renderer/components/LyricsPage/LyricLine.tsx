/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import { syncedLyricsRegex } from './LyricsPage';

interface LyricProp {
  lyric: string;
  index: number;
  syncedLyrics?: { start: number; end: number };
}

const LyricLine = (props: LyricProp) => {
  const { isMiniPlayer } = React.useContext(AppContext);
  const { songPosition } = React.useContext(SongPositionContext);
  const { updateSongPosition } = React.useContext(AppUpdateContext);
  const lyricsRef = React.useRef(null as HTMLDivElement | null);

  const { index, lyric, syncedLyrics } = props;

  React.useEffect(() => {
    if (lyricsRef.current && syncedLyrics) {
      const { start, end } = syncedLyrics;
      if (songPosition > start && songPosition < end) {
        lyricsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [syncedLyrics, songPosition]);
  return (
    <div
      style={{
        animationDelay: `${250 + 25 * (index + 1)}ms`,
        // opacity: isSynced ? '0.5' : '1',
      }}
      className={`appear-from-bottom highlight mb-5 select-text text-center font-['Poppins'] text-4xl font-medium text-font-color-black transition-[transform,color] duration-200 first:mt-8 last:mb-4 empty:mb-16 dark:text-font-color-white ${
        syncedLyrics
          ? `cursor-pointer ${
              songPosition > syncedLyrics.start &&
              songPosition < syncedLyrics.end
                ? '!scale-100 text-5xl !text-opacity-100'
                : '!scale-75 !text-opacity-20 hover:!text-opacity-75'
            }`
          : ''
      } ${isMiniPlayer && '!mb-2 !text-2xl !text-font-color-white'}`}
      ref={lyricsRef}
      onClick={() => syncedLyrics && updateSongPosition(syncedLyrics.start)}
    >
      {lyric.replaceAll(syncedLyricsRegex, '').trim()}
    </div>
  );
};

export default LyricLine;

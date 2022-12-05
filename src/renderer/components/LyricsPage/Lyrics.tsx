/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';

interface LyricProp {
  lyric: string;
  index: number;
  syncLyrics?: { start: number; end: number };
}

const Lyric = (props: LyricProp) => {
  const { songPosition } = React.useContext(SongPositionContext);
  const { updateSongPosition } = React.useContext(AppUpdateContext);
  const lyricsRef = React.useRef(null as HTMLDivElement | null);

  const { index, lyric, syncLyrics } = props;

  React.useEffect(() => {
    if (lyricsRef.current && syncLyrics) {
      const { start, end } = syncLyrics;
      if (songPosition > start && songPosition < end) {
        lyricsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [syncLyrics, songPosition]);
  return (
    <div
      style={{
        animationDelay: `${250 + 25 * (index + 1)}ms`,
        // opacity: isSynced ? '0.5' : '1',
      }}
      className={`appear-from-bottom highlight mb-5 select-text text-center font-['Poppins'] text-4xl font-medium text-font-color-black transition-[transform,color] duration-200 empty:mb-16 dark:text-font-color-white ${
        syncLyrics
          ? `cursor-pointer hover:!text-opacity-100 ${
              songPosition > syncLyrics.start && songPosition < syncLyrics.end
                ? '!scale-100 text-5xl'
                : '!scale-75 !text-opacity-20'
            }`
          : ''
      }`}
      ref={lyricsRef}
      onClick={() => syncLyrics && updateSongPosition(syncLyrics.start)}
    >
      {lyric.replaceAll(/^\[\d+:\d{1,2}\.\d{1,2}]/gm, '').trim()}
    </div>
  );
};

export default Lyric;

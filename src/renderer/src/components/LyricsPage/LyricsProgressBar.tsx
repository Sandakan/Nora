import { useCallback, useEffect, useRef } from 'react';

type Props = {
  syncedLyrics: { start: number; end: number };
  delay: number;
};

const LyricsProgressBar = (props: Props) => {
  const { syncedLyrics, delay } = props;
  const myElementRef = useRef<HTMLSpanElement>(null);

  const handleLyricsActivity = useCallback(
    (e: Event) => {
      if ('detail' in e && typeof e.detail === 'number') {
        const songPosition = e.detail as number;
        const progress =
          songPosition < syncedLyrics.start - delay
            ? '0%'
            : songPosition > syncedLyrics.end - delay
              ? '100%'
              : `${
                  ((songPosition - (syncedLyrics.start - delay)) /
                    (syncedLyrics.end - delay - (syncedLyrics.start - delay))) *
                  100
                }%`;

        if (myElementRef.current) {
          myElementRef.current.style.setProperty('--duration', progress);
        }
      }
    },
    [delay, syncedLyrics.end, syncedLyrics.start]
  );

  useEffect(() => {
    document.addEventListener('player/positionChange', handleLyricsActivity);

    return () => document.removeEventListener('player/positionChange', handleLyricsActivity);
  }, [handleLyricsActivity]);

  return (
    <span
      ref={myElementRef}
      className="bg-font-color-highlight/25 dark:bg-dark-font-color-highlight/25 visible! mt-1 block h-1 w-1/2 max-w-[4rem] min-w-[2rem] rounded-md opacity-100! transition-[visibility,opacity]"
    >
      <span className="bg-font-color-highlight/40 dark:bg-dark-font-color-highlight/50 block h-full w-[var(--duration)] rounded-md transition-[width] duration-300!" />
    </span>
  );
};

export default LyricsProgressBar;

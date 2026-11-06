import { useEffect, useRef } from 'react';

import { getPlayer } from '../../hooks/useAudioPlayer';

type Props = {
  syncedLyrics: { start: number; end: number };
  delay: number;
};

const LyricsProgressBar = (props: Props) => {
  const { syncedLyrics, delay } = props;
  const myElementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const player = getPlayer();
    let animId: number | null = null;

    const start = syncedLyrics.start - delay;
    const end = syncedLyrics.end - delay;
    const duration = end - start;

    const updateProgress = () => {
      const songPosition = player.getExactCurrentTime();
      let percentage = 0;
      if (duration > 0) {
        if (songPosition <= start) {
          percentage = 0;
        } else if (songPosition >= end) {
          percentage = 100;
        } else {
          percentage = ((songPosition - start) / duration) * 100;
        }
      }

      if (myElementRef.current) {
        myElementRef.current.style.setProperty('--duration', `${percentage}%`);
      }
    };

    const loop = () => {
      updateProgress();
      animId = requestAnimationFrame(loop);
    };

    if (!player.paused) {
      animId = requestAnimationFrame(loop);
    }

    const onPlay = () => {
      if (animId === null) {
        animId = requestAnimationFrame(loop);
      }
    };

    const onPause = () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      updateProgress();
    };

    player.on('play', onPlay);
    player.on('pause', onPause);
    player.on('seeked', updateProgress);
    player.on('timeUpdate', updateProgress);

    updateProgress();

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      player.off('play', onPlay);
      player.off('pause', onPause);
      player.off('seeked', updateProgress);
      player.off('timeUpdate', updateProgress);
    };
  }, [delay, syncedLyrics.end, syncedLyrics.start]);

  return (
    <span
      ref={myElementRef}
      className="bg-font-color-highlight/25 dark:bg-dark-font-color-highlight/25 visible! mt-1 block h-1 w-1/2 max-w-[4rem] min-w-[2rem] rounded-md opacity-100! transition-[visibility,opacity]"
    >
      <span className="bg-font-color-highlight/40 dark:bg-dark-font-color-highlight/50 block h-full w-[var(--duration)] rounded-md" />
    </span>
  );
};

export default LyricsProgressBar;

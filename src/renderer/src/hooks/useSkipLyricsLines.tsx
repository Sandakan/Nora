import { useCallback, useContext, useEffect } from 'react';

import { AppUpdateContext } from '../contexts/AppUpdateContext';
import { getPlayer } from './useAudioPlayer';

const useSkipLyricsLines = (lyrics?: SongLyrics | null) => {
  const { updateSongPosition } = useContext(AppUpdateContext);

  const skipLyricsLines = useCallback(
    (option: 'previous' | 'next' = 'next') => {
      if (lyrics?.lyrics?.isSynced && lyrics.lyrics.parsedLyrics) {
        const { parsedLyrics, offset = 0 } = lyrics.lyrics;
        const player = getPlayer();
        const currentTime = player.getExactCurrentTime();

        for (let i = 0; i < parsedLyrics.length; i += 1) {
          const start = (parsedLyrics[i].start || 0) + offset;
          const end =
            (parsedLyrics[i].end === Number.POSITIVE_INFINITY
              ? Number.MAX_VALUE
              : parsedLyrics[i].end || 0) + offset;

          const isInRange = currentTime >= start && currentTime < end;
          if (isInRange) {
            if (option === 'next' && parsedLyrics[i + 1]) {
              updateSongPosition((parsedLyrics[i + 1].start || 0) + offset);
            } else if (option === 'previous' && parsedLyrics[i - 1]) {
              updateSongPosition((parsedLyrics[i - 1].start || 0) + offset);
            }
            return;
          }
        }

        // If currently in intro before first line and user presses next
        if (
          option === 'next' &&
          parsedLyrics.length > 0 &&
          currentTime < (parsedLyrics[0].start || 0) + offset
        ) {
          updateSongPosition((parsedLyrics[0].start || 0) + offset);
        }
      }
    },
    [lyrics?.lyrics, updateSongPosition]
  );

  const manageLyricsPageKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowUp') skipLyricsLines('previous');
      else if (e.altKey && e.key === 'ArrowDown') skipLyricsLines('next');
    },
    [skipLyricsLines]
  );

  useEffect(() => {
    window.addEventListener('keydown', manageLyricsPageKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', manageLyricsPageKeyboardShortcuts);
    };
  }, [manageLyricsPageKeyboardShortcuts]);

  return { skipLyricsLines };
};

export default useSkipLyricsLines;

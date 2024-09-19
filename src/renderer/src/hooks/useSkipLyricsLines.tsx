import { useCallback, useContext, useEffect } from 'react';
import { AppUpdateContext } from '../contexts/AppUpdateContext';

const useSkipLyricsLines = (lyrics?: SongLyrics | null) => {
  const { updateSongPosition } = useContext(AppUpdateContext);

  const skipLyricsLines = useCallback(
    (option: 'previous' | 'next' = 'next') => {
      if (lyrics?.lyrics.isSynced) {
        const { isSynced, parsedLyrics } = lyrics.lyrics;

        if (isSynced) {
          document.addEventListener(
            'player/positionChange',
            (e) => {
              if ('detail' in e && !Number.isNaN(e.detail)) {
                const songPosition = e.detail as number;

                for (let i = 0; i < parsedLyrics.length; i += 1) {
                  const { start = 0, end = 0 } = parsedLyrics[i];

                  const isInRange = songPosition > start && songPosition < end;
                  if (isInRange) {
                    if (option === 'next' && parsedLyrics[i + 1])
                      updateSongPosition(parsedLyrics[i + 1].start || 0);
                    else if (option === 'previous' && parsedLyrics[i - 1])
                      updateSongPosition(parsedLyrics[i - 1].start || 0);
                  }
                }
              }
            },
            { once: true }
          );
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

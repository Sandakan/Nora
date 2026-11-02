import { useEffect, useRef, useState } from 'react';

import { getPlayer } from './useAudioPlayer';

/**
 * Resolves the active lyric line index for a given playback time with binary search and intro
 * detection.
 *
 * @param parsedLyrics - Array of parsed lyric lines with optional start/end timestamps
 * @param currentTime - Exact current playback time in seconds
 * @param offset - Timing offset in seconds
 * @param cachedIndex - Optional previous active index for O(1) fast-path validation
 * @returns The index of the active lyric line (-1 for intro "•••", 0..N-1 for lines, or -2 if none)
 */
export function resolveActiveLyricIndex(
  parsedLyrics: LyricLine[] | undefined,
  currentTime: number,
  offset = 0,
  cachedIndex = -2
): number {
  if (!parsedLyrics || parsedLyrics.length === 0) {
    return -2;
  }

  const firstLineStart = (parsedLyrics[0]?.start ?? 0) + offset;
  // Intro line check: 0 <= currentTime < firstLineStart
  if (firstLineStart > 0 && currentTime >= 0 && currentTime < firstLineStart) {
    return -1;
  }

  // Fast-path: check if cachedIndex is still active
  if (cachedIndex >= 0 && cachedIndex < parsedLyrics.length) {
    const line = parsedLyrics[cachedIndex];
    const lineStart = (line.start ?? 0) + offset;
    const lineEnd =
      (line.end === Number.POSITIVE_INFINITY ? Number.MAX_VALUE : (line.end ?? 0)) + offset;
    if (currentTime >= lineStart && currentTime < lineEnd) {
      return cachedIndex;
    }
  }

  // Binary search across parsedLyrics
  let low = 0;
  let high = parsedLyrics.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const line = parsedLyrics[mid];
    const lineStart = (line.start ?? 0) + offset;
    const lineEnd =
      (line.end === Number.POSITIVE_INFINITY ? Number.MAX_VALUE : (line.end ?? 0)) + offset;

    if (currentTime >= lineStart && currentTime < lineEnd) {
      return mid;
    }
    if (currentTime < lineStart) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return -2;
}

/**
 * Tracks the current active lyric line index using high-resolution monotonic clock interpolation
 * (`player.getExactCurrentTime()`) at 60 FPS during playback.
 *
 * @param parsedLyrics - Array of parsed lyric lines with optional start/end timestamps
 * @param offset - Timing offset in seconds
 * @returns The index of the active lyric line (-1 for intro "•••", 0..N-1 for lines, or -2 if none)
 */
export function useActiveLyricLine(parsedLyrics: LyricLine[] | undefined, offset = 0): number {
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-2);
  const activeLineIndexRef = useRef<number>(-2);

  useEffect(() => {
    if (!parsedLyrics || parsedLyrics.length === 0) {
      setActiveLineIndex(-2);
      activeLineIndexRef.current = -2;
      return undefined;
    }

    const player = getPlayer();
    let animId: number | null = null;

    const updateActiveIndex = () => {
      const currentTime = player.getExactCurrentTime();
      const newIndex = resolveActiveLyricIndex(
        parsedLyrics,
        currentTime,
        offset,
        activeLineIndexRef.current
      );
      if (newIndex !== activeLineIndexRef.current) {
        activeLineIndexRef.current = newIndex;
        setActiveLineIndex(newIndex);
      }
    };

    const loop = () => {
      updateActiveIndex();
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
      updateActiveIndex();
    };

    player.on('play', onPlay);
    player.on('pause', onPause);
    player.on('seeked', updateActiveIndex);
    player.on('timeUpdate', updateActiveIndex);

    updateActiveIndex();

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      player.off('play', onPlay);
      player.off('pause', onPause);
      player.off('seeked', updateActiveIndex);
      player.off('timeUpdate', updateActiveIndex);
    };
  }, [parsedLyrics, offset]);

  return activeLineIndex;
}

export default useActiveLyricLine;

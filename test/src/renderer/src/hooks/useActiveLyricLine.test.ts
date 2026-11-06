import { describe, test, expect, vi } from 'vitest';

vi.mock('../../../../../src/renderer/src/hooks/useAudioPlayer', () => ({
  getPlayer: vi.fn(() => ({
    getExactCurrentTime: vi.fn(() => 0),
    paused: true,
    on: vi.fn(),
    off: vi.fn()
  }))
}));

import { resolveActiveLyricIndex } from '../../../../../src/renderer/src/hooks/useActiveLyricLine';

describe('useActiveLyricLine / resolveActiveLyricIndex', () => {
  const mockLyrics: LyricLine[] = [
    {
      originalText: 'First line',
      start: 10.0,
      end: 20.0,
      isEnhancedSynced: false,
      translatedTexts: []
    },
    {
      originalText: 'Second line',
      start: 20.0,
      end: 35.5,
      isEnhancedSynced: false,
      translatedTexts: []
    },
    {
      originalText: 'Third line',
      start: 35.5,
      end: 50.0,
      isEnhancedSynced: false,
      translatedTexts: []
    }
  ];

  test('returns -2 when parsedLyrics is empty or undefined', () => {
    expect(resolveActiveLyricIndex(undefined, 10)).toBe(-2);
    expect(resolveActiveLyricIndex([], 10)).toBe(-2);
  });

  test('returns -1 for intro section before the first line starts', () => {
    // Song position at 5 seconds, first line starts at 10.0s
    expect(resolveActiveLyricIndex(mockLyrics, 0)).toBe(-1);
    expect(resolveActiveLyricIndex(mockLyrics, 5.0)).toBe(-1);
    expect(resolveActiveLyricIndex(mockLyrics, 9.99)).toBe(-1);
  });

  test('resolves correct line index when playback is within a line', () => {
    // Line 0: 10.0 to 20.0
    expect(resolveActiveLyricIndex(mockLyrics, 10.0)).toBe(0);
    expect(resolveActiveLyricIndex(mockLyrics, 15.34)).toBe(0);
    expect(resolveActiveLyricIndex(mockLyrics, 19.99)).toBe(0);

    // Line 1: 20.0 to 35.5
    expect(resolveActiveLyricIndex(mockLyrics, 20.0)).toBe(1);
    expect(resolveActiveLyricIndex(mockLyrics, 30.12)).toBe(1);

    // Line 2: 35.5 to 50.0
    expect(resolveActiveLyricIndex(mockLyrics, 35.5)).toBe(2);
    expect(resolveActiveLyricIndex(mockLyrics, 49.99)).toBe(2);
  });

  test('returns -2 when playback is beyond the last line', () => {
    expect(resolveActiveLyricIndex(mockLyrics, 50.0)).toBe(-2);
    expect(resolveActiveLyricIndex(mockLyrics, 120.0)).toBe(-2);
  });

  test('applies timing offset correctly', () => {
    // With offset = +2.0 seconds:
    // Line 0 becomes 12.0 to 22.0
    expect(resolveActiveLyricIndex(mockLyrics, 10.5, 2.0)).toBe(-1); // still in intro
    expect(resolveActiveLyricIndex(mockLyrics, 12.0, 2.0)).toBe(0);
    expect(resolveActiveLyricIndex(mockLyrics, 21.9, 2.0)).toBe(0);
    expect(resolveActiveLyricIndex(mockLyrics, 22.0, 2.0)).toBe(1);
  });

  test('uses fast-path check when cachedIndex is still active', () => {
    // Current index is 1 (20.0 to 35.5)
    const result = resolveActiveLyricIndex(mockLyrics, 25.0, 0, 1);
    expect(result).toBe(1);

    // Current index 1 has ended, transitions to line 2 (35.5)
    const nextResult = resolveActiveLyricIndex(mockLyrics, 36.0, 0, 1);
    expect(nextResult).toBe(2);
  });

  test('handles lines starting at 0.0s without false intro trigger', () => {
    const zeroStartLyrics: LyricLine[] = [
      {
        originalText: 'Immediate first line',
        start: 0.0,
        end: 5.0,
        isEnhancedSynced: false,
        translatedTexts: []
      }
    ];

    expect(resolveActiveLyricIndex(zeroStartLyrics, 0.0)).toBe(0);
    expect(resolveActiveLyricIndex(zeroStartLyrics, 2.5)).toBe(0);
    expect(resolveActiveLyricIndex(zeroStartLyrics, 5.0)).toBe(-2);
  });
});

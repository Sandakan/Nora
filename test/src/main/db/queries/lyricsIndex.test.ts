import { describe, it, expect, vi } from 'vitest';

vi.mock('@main/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

vi.mock('@main/db/queries/settings', () => ({
  getUserSettings: vi.fn().mockResolvedValue({ customLrcFilesSaveLocation: null })
}));

vi.mock('@db/db', () => ({
  db: {}
}));

vi.mock('@db/schema', () => ({
  songLyrics: { songId: 'songId' },
  songs: { id: 'id', path: 'path' }
}));

vi.mock('@main/core/getSongLyrics', () => ({
  getLrcFilePaths: vi.fn().mockReturnValue([])
}));

import {
  countBackfillResults,
  type LyricsIndexResult
} from '@main/db/queries/lyricsIndex';

const fulfilled = (value: LyricsIndexResult): PromiseSettledResult<LyricsIndexResult> => ({
  status: 'fulfilled',
  value
});

const rejected = (): PromiseSettledResult<LyricsIndexResult> => ({
  status: 'rejected',
  reason: new Error('boom')
});

describe('countBackfillResults', () => {
  it('counts read-error as a failure so isLyricIndexBuilt is not set', () => {
    const counts = countBackfillResults([fulfilled('indexed'), fulfilled('read-error')]);
    expect(counts.indexed).toBe(1);
    expect(counts.failed).toBe(1);
    expect(counts.processed).toBe(2);
  });

  it('treats absent as a valid completed state (not a failure)', () => {
    const counts = countBackfillResults([fulfilled('absent'), fulfilled('indexed')]);
    expect(counts.failed).toBe(0);
    expect(counts.indexed).toBe(1);
    expect(counts.processed).toBe(2);
  });

  it('counts rejected promises as failures', () => {
    const counts = countBackfillResults([fulfilled('indexed'), rejected()]);
    expect(counts.failed).toBe(1);
    expect(counts.processed).toBe(1);
    expect(counts.indexed).toBe(1);
  });

  it('returns all-zero counts for an empty batch', () => {
    const counts = countBackfillResults([]);
    expect(counts).toEqual({ processed: 0, indexed: 0, failed: 0 });
  });
});
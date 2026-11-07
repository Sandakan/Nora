import { describe, expect, it, vi } from 'vitest';

vi.mock('@main/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('@main/db/db', () => ({
  db: {
    query: {
      songs: { findFirst: vi.fn(), findMany: vi.fn() },
      songAudioFeatures: { findFirst: vi.fn(), findMany: vi.fn() }
    },
    insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoUpdate: vi.fn() })) })),
    delete: vi.fn(() => Promise.resolve()),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => [{ count: 10 }]),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => [{ count: 7 }])
        })),
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => [])
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@main/core/audioEngine', () => ({
  default: {
    analyzeAudioFeatures: vi.fn()
  }
}));

import {
  build14DVector,
  CURRENT_FEATURE_VERSION,
  getFeatureIndexingStatus,
  indexSongAudioFeatures,
  indexSongOnPlayback,
  pauseBackgroundFeatureIndexer,
  reindexAudioFeatures,
  resumeBackgroundFeatureIndexer,
  type VectorMetaInputs
} from '../../../../src/main/recommendations/featureIndexer';
import type { JsAudioFeatures } from '../../../../src/main/core/audioEngine';

describe('featureIndexer', () => {
  const dummyDsp: JsAudioFeatures = {
    rmsEnergy: 0.15,
    crestFactor: 6.0,
    zeroCrossingRate: 0.08,
    spectralCentroid: 2500.0,
    lowEnergyRatio: 0.4,
    midEnergyRatio: 0.4,
    highEnergyRatio: 0.2,
    estimatedBpm: 120.0,
    pulseClarity: 0.65
  };

  const dummyMeta: VectorMetaInputs = {
    bpm: 120,
    replayGainTrackGain: -6.0,
    durationSecs: 210,
    year: 2020,
    globalListeners: 50000
  };

  it('should export current feature version as 1', () => {
    expect(CURRENT_FEATURE_VERSION).toBe(1);
  });

  it('should build a valid 14-dimensional PostgreSQL cube string', () => {
    const vectorStr = build14DVector(dummyDsp, dummyMeta);
    expect(vectorStr).toMatch(/^\([-0-9., ]+\)$/);

    const dims = vectorStr
      .replace(/[()]/g, '')
      .split(',')
      .map(Number);
    expect(dims).toHaveLength(14);

    for (const d of dims) {
      expect(d).toBeGreaterThanOrEqual(0.0);
      expect(d).toBeLessThanOrEqual(1.0);
    }
  });

  it('should use estimatedBpm when metadata bpm is absent or non-positive', () => {
    const metaWithoutBpm: VectorMetaInputs = {
      ...dummyMeta,
      bpm: null
    };

    const vectorStr = build14DVector(dummyDsp, metaWithoutBpm);
    const dims = vectorStr
      .replace(/[()]/g, '')
      .split(',')
      .map(Number);

    // dim 8 is estimated BPM normalized, dim 10 is effective BPM
    expect(dims[7]).toBe(dims[9]);
  });

  it('should clamp extreme DSP values strictly between 0.0 and 1.0', () => {
    const extremeDsp: JsAudioFeatures = {
      rmsEnergy: 10.0, // way above 1.0
      crestFactor: 100.0, // way above 20.0
      zeroCrossingRate: 2.0,
      spectralCentroid: 50000.0,
      lowEnergyRatio: 5.0,
      midEnergyRatio: -1.0,
      highEnergyRatio: 10.0,
      estimatedBpm: 500.0,
      pulseClarity: 5.0
    };

    const extremeMeta: VectorMetaInputs = {
      bpm: 999,
      replayGainTrackGain: 50.0,
      durationSecs: 5000,
      year: 2100,
      globalListeners: 100000000
    };

    const vectorStr = build14DVector(extremeDsp, extremeMeta);
    const dims = vectorStr
      .replace(/[()]/g, '')
      .split(',')
      .map(Number);

    for (const d of dims) {
      expect(d).toBeGreaterThanOrEqual(0.0);
      expect(d).toBeLessThanOrEqual(1.0);
    }
  });

  it('should default replayGain, year, and popularity gracefully when metadata is missing', () => {
    const minimalMeta: VectorMetaInputs = {
      durationSecs: 180
    };

    const vectorStr = build14DVector(dummyDsp, minimalMeta);
    const dims = vectorStr
      .replace(/[()]/g, '')
      .split(',')
      .map(Number);

    // ReplayGain default is 0.5
    expect(dims[10]).toBe(0.5);
    // Year default is 0.5
    expect(dims[12]).toBe(0.5);
    // Popularity with 0 listeners is 0
    expect(dims[13]).toBe(0);
  });

  it('should handle analyzeAudioFeatures failure gracefully without throwing and write fallback on max attempts', async () => {
    const { default: audioEngine } = await import('@main/core/audioEngine');
    vi.mocked(audioEngine.analyzeAudioFeatures).mockRejectedValue(new Error('Corrupt audio file'));

    const res1 = await indexSongAudioFeatures(999, 'bad_file.mp3');
    expect(res1).toBeNull();

    const res2 = await indexSongAudioFeatures(999, 'bad_file.mp3');
    expect(res2).toBeNull();

    // 3rd attempt triggers max attempts fallback write
    const res3 = await indexSongAudioFeatures(999, 'bad_file.mp3');
    expect(res3).toBeNull();
  });

  it('should query and calculate feature indexing status accurately', async () => {
    const status = await getFeatureIndexingStatus();
    expect(status.totalSongs).toBe(10);
    expect(status.indexedSongs).toBe(7);
    expect(status.remainingSongs).toBe(3);
    expect(status.percentage).toBe(70);
  });

  it('should allow pausing and resuming background indexing state', async () => {
    pauseBackgroundFeatureIndexer();
    let status = await getFeatureIndexingStatus();
    expect(status.status).toBe('paused');

    resumeBackgroundFeatureIndexer();
    status = await getFeatureIndexingStatus();
    expect(status.status).not.toBe('paused');
  });

  it('should support re-indexing with mode all deleting existing features', async () => {
    const { db } = await import('@main/db/db');
    await reindexAudioFeatures('all');
    expect(db.delete).toHaveBeenCalled();
  });

  it('should skip opportunistic playback indexing if song is already indexed', async () => {
    const { db } = await import('@main/db/db');
    const { default: audioEngine } = await import('@main/core/audioEngine');
    vi.mocked(db.query.songAudioFeatures.findFirst).mockResolvedValueOnce({
      songId: 101
    } as unknown as Awaited<ReturnType<typeof db.query.songAudioFeatures.findFirst>>);
    const analyzeSpy = vi.mocked(audioEngine.analyzeAudioFeatures);
    analyzeSpy.mockClear();

    await indexSongOnPlayback(101, 'test.mp3');
    expect(analyzeSpy).not.toHaveBeenCalled();
  });
});

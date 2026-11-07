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
      playEvents: { findMany: vi.fn().mockResolvedValue([]) },
      songs: { findMany: vi.fn().mockResolvedValue([]) },
      skipEvents: { findMany: vi.fn().mockResolvedValue([]) },
      songAudioFeatures: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) },
      songSimilarities: { findMany: vi.fn().mockResolvedValue([]) },
      songsLastfmTags: { findMany: vi.fn().mockResolvedValue([]) }
    }
  }
}));

vi.mock('../../../../src/main/core/getSongInfo', () => ({
  default: vi.fn().mockResolvedValue([])
}));

import {
  averageVectors,
  euclideanDistance,
  getCircadianTimeBlock,
  parseVector,
  getPersonalizedRecommendations,
  getSimilarSongsForTrack,
  getSongRadioQueue
} from '../../../../src/main/recommendations/recommendationEngine';

describe('recommendationEngine helpers', () => {
  describe('parseVector', () => {
    it('should parse valid cube string into array of numbers', () => {
      const vecStr = '(0.12, 0.45, 0.88, 0.33)';
      const parsed = parseVector(vecStr);
      expect(parsed).toEqual([0.12, 0.45, 0.88, 0.33]);
    });

    it('should return number array as is if already array', () => {
      const arr = [0.1, 0.2, 0.3];
      expect(parseVector(arr)).toEqual([0.1, 0.2, 0.3]);
    });

    it('should return null for invalid strings or empty values', () => {
      expect(parseVector('')).toBeNull();
      expect(parseVector('()')).toBeNull();
      expect(parseVector('(abc,def)')).toBeNull();
      expect(parseVector(null)).toBeNull();
      expect(parseVector(undefined)).toBeNull();
      expect(parseVector(123)).toBeNull();
    });
  });

  describe('euclideanDistance', () => {
    it('should return 0 for identical vectors', () => {
      const v = [0.2, 0.5, 0.8];
      expect(euclideanDistance(v, v)).toBe(0);
    });

    it('should correctly calculate Euclidean distance for known points', () => {
      // 3-4-5 triangle
      const a = [0, 0];
      const b = [3, 4];
      expect(euclideanDistance(a, b)).toBeCloseTo(5.0);
    });

    it('should handle multi-dimensional vectors', () => {
      const a = [1, 1, 1, 1];
      const b = [2, 2, 2, 2];
      expect(euclideanDistance(a, b)).toBeCloseTo(2.0); // sqrt(4 * 1^2) = 2
    });
  });

  describe('averageVectors', () => {
    it('should calculate the centroid of vectors correctly', () => {
      const v1 = [0.2, 0.4, 0.6];
      const v2 = [0.4, 0.6, 0.8];
      const avg = averageVectors([v1, v2]);
      expect(avg).toEqual([0.3, 0.5, 0.7]);
    });

    it('should return null for empty array', () => {
      expect(averageVectors([])).toBeNull();
    });
  });

  describe('getCircadianTimeBlock', () => {
    it('should return Morning Flow for 07:00', () => {
      const block = getCircadianTimeBlock(7);
      expect(block.label).toBe('Morning Flow');
      expect(block.blockStart).toBe(5);
      expect(block.blockEnd).toBe(10);
    });

    it('should return Midday Focus for 12:00', () => {
      const block = getCircadianTimeBlock(12);
      expect(block.label).toBe('Midday Focus');
    });

    it('should return Afternoon Groove for 16:00', () => {
      const block = getCircadianTimeBlock(16);
      expect(block.label).toBe('Afternoon Groove');
    });

    it('should return Evening Chill for 20:00', () => {
      const block = getCircadianTimeBlock(20);
      expect(block.label).toBe('Evening Chill');
    });

    it('should return Late Night Vibe for 01:00 and 23:00', () => {
      expect(getCircadianTimeBlock(23).label).toBe('Late Night Vibe');
      expect(getCircadianTimeBlock(1).label).toBe('Late Night Vibe');
    });
  });

  describe('engine query methods', () => {
    it('should handle getPersonalizedRecommendations gracefully when DB is empty', async () => {
      const recs = await getPersonalizedRecommendations({ limit: 10 });
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBe(0);
    });

    it('should handle getSimilarSongsForTrack gracefully when no features exist', async () => {
      const similar = await getSimilarSongsForTrack(123, 5);
      expect(Array.isArray(similar)).toBe(true);
      expect(similar.length).toBe(0);
    });

    it('should handle getSongRadioQueue gracefully with empty library', async () => {
      const queue = await getSongRadioQueue(123, 10);
      expect(Array.isArray(queue)).toBe(true);
      expect(queue.length).toBe(0);
    });

    it('should sequence radio queue without mutating candidate vectors in-place', async () => {
      const { db } = await import('@main/db/db');
      const candidate1Vec = '(0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1)';
      const candidate2Vec = '(0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2)';
      const candidate3Vec = '(0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9)';

      vi.mocked(db.query.songAudioFeatures.findFirst).mockResolvedValueOnce({
        songId: 1,
        featureVector: candidate1Vec
      } as any);

      vi.mocked(db.query.songAudioFeatures.findMany).mockResolvedValueOnce([
        { songId: 1, featureVector: candidate1Vec },
        { songId: 2, featureVector: candidate2Vec },
        { songId: 3, featureVector: candidate3Vec }
      ] as any);

      const queue = await getSongRadioQueue(1, 2);
      expect(queue).toEqual([2, 3]);
    });
  });
});

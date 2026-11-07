import { describe, expect, it, vi, beforeEach } from 'vitest';
import { recommendationQuery } from '../../../../../src/renderer/src/queries/recommendations';

describe('recommendationQuery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('indexingStatus', () => {
    it('returns indexing status from window.api.recommendations.getIndexingStatus', async () => {
      const mockStatus: FeatureIndexingStatus = {
        totalSongs: 100,
        indexedSongs: 45,
        remainingSongs: 55,
        percentage: 45,
        status: 'indexing',
        currentSong: {
          title: 'Test Song',
          artists: 'Test Artist'
        }
      };

      (window as unknown as { api: { recommendations: { getIndexingStatus: () => Promise<FeatureIndexingStatus> } } }).api = {
        recommendations: {
          getIndexingStatus: vi.fn().mockResolvedValue(mockStatus),
          getPersonalizedRecommendations: vi.fn(),
          getSimilarSongsForTrack: vi.fn(),
          getSongRadioQueue: vi.fn(),
          pauseIndexing: vi.fn(),
          resumeIndexing: vi.fn(),
          reindex: vi.fn(),
          onIndexingProgress: vi.fn()
        }
      };

      const result = await recommendationQuery.indexingStatus.queryFn();
      expect(result).toEqual(mockStatus);
    });

    it('returns fallback idle status on error', async () => {
      (window as unknown as { api: { recommendations: { getIndexingStatus: () => Promise<FeatureIndexingStatus> } } }).api = {
        recommendations: {
          getIndexingStatus: vi.fn().mockRejectedValue(new Error('IPC failed')),
          getPersonalizedRecommendations: vi.fn(),
          getSimilarSongsForTrack: vi.fn(),
          getSongRadioQueue: vi.fn(),
          pauseIndexing: vi.fn(),
          resumeIndexing: vi.fn(),
          reindex: vi.fn(),
          onIndexingProgress: vi.fn()
        }
      };

      const result = await recommendationQuery.indexingStatus.queryFn();
      expect(result).toEqual({
        totalSongs: 0,
        indexedSongs: 0,
        remainingSongs: 0,
        percentage: 0,
        status: 'idle',
        currentSong: null
      });
    });
  });

  describe('personalized', () => {
    it('queries personalized recommendations with default and custom limits', async () => {
      const mockResult: RecommendedSongResult[] = [
        {
          songId: 1,
          title: 'Rec Song 1',
          artists: [{ artistId: '1', name: 'Artist 1' }],
          score: 0.95,
          reason: 'acoustic_similarity'
        }
      ];

      const getRecsMock = vi.fn().mockResolvedValue(mockResult);
      (window as unknown as { api: { recommendations: { getPersonalizedRecommendations: typeof getRecsMock } } }).api = {
        recommendations: {
          getPersonalizedRecommendations: getRecsMock,
          getIndexingStatus: vi.fn(),
          getSimilarSongsForTrack: vi.fn(),
          getSongRadioQueue: vi.fn(),
          pauseIndexing: vi.fn(),
          resumeIndexing: vi.fn(),
          reindex: vi.fn(),
          onIndexingProgress: vi.fn()
        }
      };

      const queryDef = recommendationQuery.personalized({ limit: 10, sessionSeedSongIds: [42] });
      expect(queryDef.queryKey).toEqual(['recommendations', 'personalized', 'limit=10', 'seeds=42']);

      const data = await queryDef.queryFn();
      expect(data).toEqual(mockResult);
      expect(getRecsMock).toHaveBeenCalledWith({ limit: 10, sessionSeedSongIds: [42] });
    });
  });

  describe('similarSongs', () => {
    it('queries similar songs for a track', async () => {
      const mockSimilar: RecommendedSongResult[] = [
        {
          songId: 2,
          title: 'Similar Song',
          artists: [],
          score: 0.88,
          reason: 'acoustic_similarity'
        }
      ];

      const getSimilarMock = vi.fn().mockResolvedValue(mockSimilar);
      (window as unknown as { api: { recommendations: { getSimilarSongsForTrack: typeof getSimilarMock } } }).api = {
        recommendations: {
          getSimilarSongsForTrack: getSimilarMock,
          getIndexingStatus: vi.fn(),
          getPersonalizedRecommendations: vi.fn(),
          getSongRadioQueue: vi.fn(),
          pauseIndexing: vi.fn(),
          resumeIndexing: vi.fn(),
          reindex: vi.fn(),
          onIndexingProgress: vi.fn()
        }
      };

      const queryDef = recommendationQuery.similarSongs({ songId: 5, limit: 5 });
      const data = await queryDef.queryFn();
      expect(data).toEqual(mockSimilar);
      expect(getSimilarMock).toHaveBeenCalledWith(5, 5);
    });
  });

  describe('songRadio', () => {
    it('queries song radio queue', async () => {
      const getRadioMock = vi.fn().mockResolvedValue([10, 20, 30]);
      (window as unknown as { api: { recommendations: { getSongRadioQueue: typeof getRadioMock } } }).api = {
        recommendations: {
          getSongRadioQueue: getRadioMock,
          getIndexingStatus: vi.fn(),
          getPersonalizedRecommendations: vi.fn(),
          getSimilarSongsForTrack: vi.fn(),
          pauseIndexing: vi.fn(),
          resumeIndexing: vi.fn(),
          reindex: vi.fn(),
          onIndexingProgress: vi.fn()
        }
      };

      const queryDef = recommendationQuery.songRadio({ seedSongId: 10, queueLength: 3 });
      const data = await queryDef.queryFn();
      expect(data).toEqual([10, 20, 30]);
      expect(getRadioMock).toHaveBeenCalledWith(10, 3);
    });

    it('returns empty array when songRadio fails', async () => {
      (window as unknown as { api: { recommendations: { getSongRadioQueue: () => Promise<number[]> } } }).api = {
        recommendations: {
          getSongRadioQueue: vi.fn().mockRejectedValue(new Error('IPC error')),
          getIndexingStatus: vi.fn(),
          getPersonalizedRecommendations: vi.fn(),
          getSimilarSongsForTrack: vi.fn(),
          pauseIndexing: vi.fn(),
          resumeIndexing: vi.fn(),
          reindex: vi.fn(),
          onIndexingProgress: vi.fn()
        }
      };

      const queryDef = recommendationQuery.songRadio({ seedSongId: 10 });
      const data = await queryDef.queryFn();
      expect(data).toEqual([]);
    });
  });

  describe('feature indexing operations', () => {
    it('supports pause, resume, and reindex commands via window.api.recommendations', async () => {
      const pauseMock = vi.fn().mockResolvedValue(undefined);
      const resumeMock = vi.fn().mockResolvedValue(undefined);
      const reindexMock = vi.fn().mockResolvedValue(undefined);

      (window as unknown as { api: { recommendations: { pauseIndexing: typeof pauseMock; resumeIndexing: typeof resumeMock; reindex: typeof reindexMock } } }).api = {
        recommendations: {
          pauseIndexing: pauseMock,
          resumeIndexing: resumeMock,
          reindex: reindexMock
        }
      };

      await window.api.recommendations.pauseIndexing();
      expect(pauseMock).toHaveBeenCalledTimes(1);

      await window.api.recommendations.resumeIndexing();
      expect(resumeMock).toHaveBeenCalledTimes(1);

      await window.api.recommendations.reindex('missing');
      expect(reindexMock).toHaveBeenCalledWith('missing');

      await window.api.recommendations.reindex('all');
      expect(reindexMock).toHaveBeenCalledWith('all');
    });
  });

  describe('songFeatures', () => {
    it('returns features from window.api.recommendations.getSongFeatures', async () => {
      const mockFeatures: SongAudioFeaturesData = {
        songId: 101,
        rmsEnergy: 0.2,
        crestFactor: 5.0,
        zeroCrossingRate: 0.04,
        spectralCentroid: 2400,
        lowEnergyRatio: 0.35,
        midEnergyRatio: 0.45,
        highEnergyRatio: 0.2,
        estimatedBpm: 120,
        pulseClarity: 0.75,
        globalListeners: 500,
        globalPlaycount: 2500,
        featureVersion: 1,
        updatedAt: '2026-11-07T00:00:00.000Z'
      };

      (window as unknown as { api: { recommendations: { getSongFeatures: (id: number) => Promise<SongAudioFeaturesData | null> } } }).api = {
        recommendations: {
          getSongFeatures: vi.fn().mockResolvedValue(mockFeatures)
        }
      };

      const query = recommendationQuery.songFeatures({ songId: 101 });
      const result = await query.queryFn();
      expect(result).toEqual(mockFeatures);
    });

    it('returns null on failure', async () => {
      (window as unknown as { api: { recommendations: { getSongFeatures: (id: number) => Promise<SongAudioFeaturesData | null> } } }).api = {
        recommendations: {
          getSongFeatures: vi.fn().mockRejectedValue(new Error('IPC failed'))
        }
      };

      const query = recommendationQuery.songFeatures({ songId: 999 });
      const result = await query.queryFn();
      expect(result).toBeNull();
    });
  });
});

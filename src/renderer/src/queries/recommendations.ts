import { createQueryKeys } from '@lukemorales/query-key-factory';

export const recommendationQuery = createQueryKeys('recommendations', {
  personalized: (options?: { limit?: number; sessionSeedSongIds?: number[] }) => {
    const { limit = 20, sessionSeedSongIds } = options ?? {};
    return {
      queryKey: [`limit=${limit}`, `seeds=${sessionSeedSongIds?.join(',') ?? 'default'}`],
      queryFn: async (): Promise<RecommendedSongResult[]> => {
        try {
          const result = await window.api.recommendations.getPersonalizedRecommendations({
            limit,
            sessionSeedSongIds
          });
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('[recommendationQuery.personalized] Failed:', error);
          return [];
        }
      }
    };
  },
  similarSongs: (data: { songId: number; limit?: number }) => {
    const { songId, limit = 10 } = data;
    return {
      queryKey: [`songId=${songId}`, `limit=${limit}`],
      queryFn: async (): Promise<RecommendedSongResult[]> => {
        try {
          const result = await window.api.recommendations.getSimilarSongsForTrack(songId, limit);
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('[recommendationQuery.similarSongs] Failed:', error);
          return [];
        }
      }
    };
  },
  songRadio: (data: { seedSongId: number; queueLength?: number }) => {
    const { seedSongId, queueLength = 25 } = data;
    return {
      queryKey: [`seedSongId=${seedSongId}`, `queueLength=${queueLength}`],
      queryFn: async (): Promise<number[]> => {
        try {
          const result = await window.api.recommendations.getSongRadioQueue(
            seedSongId,
            queueLength
          );
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('[recommendationQuery.songRadio] Failed:', error);
          return [];
        }
      }
    };
  },
  indexingStatus: {
    queryKey: null,
    queryFn: async (): Promise<FeatureIndexingStatus> => {
      try {
        return await window.api.recommendations.getIndexingStatus();
      } catch (error) {
        console.error('[recommendationQuery.indexingStatus] Failed:', error);
        return {
          status: 'idle',
          totalSongs: 0,
          indexedSongs: 0,
          remainingSongs: 0,
          percentage: 0,
          currentSong: null
        };
      }
    }
  },
  songFeatures: (data: { songId: number }) => {
    return {
      queryKey: [data.songId],
      queryFn: async (): Promise<SongAudioFeaturesData | null> => {
        try {
          return await window.api.recommendations.getSongFeatures(data.songId);
        } catch (error) {
          console.error('[recommendationQuery.songFeatures] Failed:', error);
          return null;
        }
      }
    };
  }
});

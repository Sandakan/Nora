import { createQueryKeys } from '@lukemorales/query-key-factory';

export const listenQuery = createQueryKeys('listens', {
  single: (data: { songId: number }) => {

    return {
      queryKey: [data.songId],
      queryFn: () => window.api.audioLibraryControls.getSongListeningData([data.songId])
    };
  }
});

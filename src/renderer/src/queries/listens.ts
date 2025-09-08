import { createQueryKeys } from '@lukemorales/query-key-factory';

export const listenQuery = createQueryKeys('listens', {
  single: (data: { songId: string }) => {
    const { songId } = data;

    return {
      queryKey: [`songId=${songId}`],
      queryFn: () => window.api.audioLibraryControls.getSongListeningData([songId])
    };
  }
});

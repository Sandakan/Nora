import { createQueryKeys } from '@lukemorales/query-key-factory';

export const queueQuery = createQueryKeys('queue', {
  info: (data: { queueType: QueueTypes; id: string }) => {
    const { queueType, id } = data;
    return {
      queryKey: [`type=${queueType}`, `id=${id}`],
      queryFn: () => window.api.queue.getQueueInfo(queueType, id)
    };
  }
});

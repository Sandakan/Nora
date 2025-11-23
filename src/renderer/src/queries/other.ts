import { createQueryKeys } from '@lukemorales/query-key-factory';

export const otherQuery = createQueryKeys('other', {
  databaseMetrics: {
    queryKey: null,
    queryFn: () => window.api.storageData.getDatabaseMetrics()
  }
});

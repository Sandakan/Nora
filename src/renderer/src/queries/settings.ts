import { createQueryKeys } from '@lukemorales/query-key-factory';

export const settingsQuery = createQueryKeys('settings', {
  all: {
    queryKey: null,
    queryFn: async () => window.api.settings.getUserSettings()
  },
  storageMetrics: {
    queryKey: null,
    queryFn: async () => window.api.storageData.getStorageUsage()
  }
});

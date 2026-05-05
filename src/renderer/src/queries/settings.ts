import { createMutationKeys, createQueryKeys } from '@lukemorales/query-key-factory';

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

export const settingsMutation = createMutationKeys('settings', {
  changeAppTheme: null,
  toggleMiniPlayerAlwaysOnTop: null
});

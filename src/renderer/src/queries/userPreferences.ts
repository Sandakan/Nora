import { createMutationKeys, createQueryKeys } from '@lukemorales/query-key-factory';

export const userPreferencesQuery = createQueryKeys('userPreferences', {
  keyboardShortcuts: {
    queryKey: null,
    queryFn: async () => window.api.settingsHelpers.getUserKeyboardShortcuts()
  },
  equalizerPreset: {
    queryKey: null,
    queryFn: async () => window.api.settingsHelpers.getUserEqualizerPreset()
  },
  ignoredArtists: {
    queryKey: null,
    queryFn: async () => window.api.settingsHelpers.getIgnoredArtists()
  },
  ignoredFeaturingArtists: {
    queryKey: null,
    queryFn: async () => window.api.settingsHelpers.getIgnoredFeaturingArtists()
  },
  ignoredDuplicateMetadata: {
    queryKey: null,
    queryFn: async () => window.api.settingsHelpers.getIgnoredDuplicateMetadata()
  }
});

export const userPreferencesMutation = createMutationKeys('userPreferences', {
  saveKeyboardShortcuts: null,
  saveEqualizerPreset: null,
  addIgnoredArtist: null,
  removeIgnoredArtist: null,
  addIgnoredFeaturingArtist: null,
  removeIgnoredFeaturingArtist: null,
  addIgnoredDuplicate: null
});

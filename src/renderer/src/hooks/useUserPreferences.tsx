import { queryClient } from '@renderer/index';
import { userPreferencesQuery, userPreferencesMutation } from '@renderer/queries/userPreferences';
import { useQuery, useMutation } from '@tanstack/react-query';

/**
 * Hook for managing user preferences from the database Includes keyboard shortcuts, equalizer
 * presets, and ignored items
 */
export function useUserPreferences() {
  // Load keyboard shortcuts
  const { data: keyboardShortcuts } = useQuery(userPreferencesQuery.keyboardShortcuts);

  // Load equalizer preset
  const { data: equalizerPreset } = useQuery(userPreferencesQuery.equalizerPreset);

  // Load ignored artists
  const { data: ignoredArtists } = useQuery(userPreferencesQuery.ignoredArtists);

  // Load ignored featuring artists
  const { data: ignoredFeaturingArtists } = useQuery(userPreferencesQuery.ignoredFeaturingArtists);

  // Load ignored duplicate metadata
  const { data: ignoredDuplicateMetadata } = useQuery(
    userPreferencesQuery.ignoredDuplicateMetadata
  );

  // Mutation: Save keyboard shortcuts
  const saveKeyboardShortcutsMutation = useMutation({
    mutationKey: userPreferencesMutation.saveKeyboardShortcuts.mutationKey,
    mutationFn: async (shortcuts: Record<string, string>) =>
      window.api.settingsHelpers.saveUserKeyboardShortcuts(shortcuts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPreferencesQuery.keyboardShortcuts.queryKey });
    }
  });

  // Mutation: Save equalizer preset
  const saveEqualizerPresetMutation = useMutation({
    mutationKey: userPreferencesMutation.saveEqualizerPreset.mutationKey,
    mutationFn: async (
      presetData:
        | Equalizer
        | {
            presetName?: string;
            frequencyBands?: number[];
            isEnabled?: boolean;
          }
    ) => {
      // Convert Equalizer to frequencyBands array if needed
      if ('thirtyTwoHertzFilter' in presetData) {
        const frequencyBands = [
          presetData.thirtyTwoHertzFilter,
          presetData.sixtyFourHertzFilter,
          presetData.hundredTwentyFiveHertzFilter,
          presetData.twoHundredFiftyHertzFilter,
          presetData.fiveHundredHertzFilter,
          presetData.thousandHertzFilter,
          presetData.twoThousandHertzFilter,
          presetData.fourThousandHertzFilter,
          presetData.eightThousandHertzFilter,
          presetData.sixteenThousandHertzFilter
        ];
        return window.api.settingsHelpers.saveUserEqualizerPreset({ frequencyBands });
      }
      return window.api.settingsHelpers.saveUserEqualizerPreset(presetData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPreferencesQuery.equalizerPreset.queryKey });
    }
  });

  // Mutation: Add ignored artist
  const addIgnoredArtistMutation = useMutation({
    mutationKey: userPreferencesMutation.addIgnoredArtist.mutationKey,
    mutationFn: async ({ artistId }: { artistId: number }) =>
      window.api.settingsHelpers.addIgnoredArtist(artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPreferencesQuery.ignoredArtists.queryKey });
    }
  });

  // Mutation: Remove ignored artist
  const removeIgnoredArtistMutation = useMutation({
    mutationKey: userPreferencesMutation.removeIgnoredArtist.mutationKey,
    mutationFn: async ({ artistId }: { artistId: number }) =>
      window.api.settingsHelpers.removeIgnoredArtist(artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPreferencesQuery.ignoredArtists.queryKey });
    }
  });

  // Mutation: Add ignored featuring artist
  const addIgnoredFeaturingArtistMutation = useMutation({
    mutationKey: userPreferencesMutation.addIgnoredFeaturingArtist.mutationKey,
    mutationFn: async ({ songIds }: { songIds: number[] }) => {
      // Handle both single songId and array of songIds
      for (const songId of songIds) {
        await window.api.settingsHelpers.addIgnoredFeaturingArtist(songId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userPreferencesQuery.ignoredFeaturingArtists.queryKey
      });
    }
  });

  // Mutation: Remove ignored featuring artist
  const removeIgnoredFeaturingArtistMutation = useMutation({
    mutationKey: userPreferencesMutation.removeIgnoredFeaturingArtist.mutationKey,
    mutationFn: async ({ songId }: { songId: number }) =>
      window.api.settingsHelpers.removeIgnoredFeaturingArtist(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userPreferencesQuery.ignoredFeaturingArtists.queryKey
      });
    }
  });

  // Mutation: Add ignored duplicate metadata
  const addIgnoredDuplicateMutation = useMutation({
    mutationKey: userPreferencesMutation.addIgnoredDuplicate?.mutationKey || null,
    mutationFn: async ({
      type,
      itemId
    }: {
      type: 'artists' | 'albums' | 'songs';
      itemId: number;
    }) => {
      const duplicateGroupId = `${type}_${itemId}`;
      // For now, add a dummy songId. The real songId would be from the duplicate group.
      await window.api.settingsHelpers.addIgnoredDuplicate(duplicateGroupId, 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userPreferencesQuery.ignoredDuplicateMetadata.queryKey
      });
    }
  });

  return {
    // Query data
    keyboardShortcuts,
    equalizerPreset,
    ignoredArtists,
    ignoredFeaturingArtists,
    ignoredDuplicateMetadata,

    // Mutations (return objects for full control)
    saveKeyboardShortcutsMutation,
    saveEqualizerPresetMutation,
    addIgnoredArtistMutation,
    removeIgnoredArtistMutation,
    addIgnoredFeaturingArtistMutation,
    removeIgnoredFeaturingArtistMutation,
    addIgnoredDuplicateMutation,

    // Shortcut mutate functions
    saveKeyboardShortcuts: saveKeyboardShortcutsMutation.mutate,
    saveEqualizerPreset: saveEqualizerPresetMutation.mutate,
    addIgnoredArtist: addIgnoredArtistMutation.mutate,
    removeIgnoredArtist: removeIgnoredArtistMutation.mutate,
    addIgnoredFeaturingArtist: addIgnoredFeaturingArtistMutation.mutate,
    removeIgnoredFeaturingArtist: removeIgnoredFeaturingArtistMutation.mutate,
    addIgnoredDuplicate: addIgnoredDuplicateMutation.mutate
  };
}

import { db } from '../db/db';
import {
  ignoredArtists,
  ignoredDuplicateMetadata,
  ignoredFeaturingArtists,
  userEqualizerPreset,
  userKeyboardShortcuts
} from '../db/schema';

export interface ExportedUserPreferences {
  keyboardShortcuts: Record<string, string>;
  equalizerPreset: {
    presetName: string;
    frequencyBands: number[];
    isEnabled: boolean;
  };
  ignoredArtists: number[];
  ignoredFeaturingArtists: number[];
  ignoredDuplicateMetadata: Array<{
    duplicateGroupId: string;
    songId: number;
  }>;
}

export const exportUserPreferences = async (): Promise<ExportedUserPreferences> => {
  const [shortcuts, equalizer, ignored, ignoredFeating, ignoredDuplicate] = await Promise.all([
    db.select().from(userKeyboardShortcuts),
    db.select().from(userEqualizerPreset),
    db.select().from(ignoredArtists),
    db.select().from(ignoredFeaturingArtists),
    db.select().from(ignoredDuplicateMetadata)
  ]);

  return {
    keyboardShortcuts: shortcuts[0]?.shortcuts || {},
    equalizerPreset: equalizer[0] || {
      presetName: 'Default',
      frequencyBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      isEnabled: false
    },
    ignoredArtists: ignored.map((item) => item.artistId),
    ignoredFeaturingArtists: ignoredFeating.map((item) => item.artistId),
    ignoredDuplicateMetadata: ignoredDuplicate.map((item) => ({
      duplicateGroupId: item.duplicateGroupId,
      songId: item.songId
    }))
  };
};

export const importUserPreferences = async (preferences: ExportedUserPreferences) => {
  await db.transaction(async (trx) => {
    // Clear existing data
    await trx.delete(userKeyboardShortcuts);
    await trx.delete(userEqualizerPreset);
    await trx.delete(ignoredArtists);
    await trx.delete(ignoredFeaturingArtists);
    await trx.delete(ignoredDuplicateMetadata);

    // Insert new data
    if (preferences.keyboardShortcuts && Object.keys(preferences.keyboardShortcuts).length > 0) {
      await trx.insert(userKeyboardShortcuts).values({ shortcuts: preferences.keyboardShortcuts });
    }

    if (preferences.equalizerPreset) {
      await trx.insert(userEqualizerPreset).values({
        presetName: preferences.equalizerPreset.presetName,
        frequencyBands: preferences.equalizerPreset.frequencyBands,
        isEnabled: preferences.equalizerPreset.isEnabled
      });
    }

    if (preferences.ignoredArtists && preferences.ignoredArtists.length > 0) {
      for (const artistId of preferences.ignoredArtists) {
        await trx.insert(ignoredArtists).values({ artistId }).onConflictDoNothing();
      }
    }

    if (preferences.ignoredFeaturingArtists && preferences.ignoredFeaturingArtists.length > 0) {
      for (const artistId of preferences.ignoredFeaturingArtists) {
        await trx.insert(ignoredFeaturingArtists).values({ artistId }).onConflictDoNothing();
      }
    }

    if (preferences.ignoredDuplicateMetadata && preferences.ignoredDuplicateMetadata.length > 0) {
      for (const item of preferences.ignoredDuplicateMetadata) {
        await trx.insert(ignoredDuplicateMetadata).values({
          duplicateGroupId: item.duplicateGroupId,
          songId: item.songId
        });
      }
    }
  });
};

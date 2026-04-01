import { eq } from 'drizzle-orm';

import { db } from '../db';
import { userEqualizerPreset, userKeyboardShortcuts } from '../schema';

// ============================================================================
// Keyboard Shortcuts Queries
// ============================================================================

export const getUserKeyboardShortcuts = async () => {
  const shortcuts = await db.query.userKeyboardShortcuts.findFirst();

  if (!shortcuts) throw new Error('User keyboard shortcuts not found');

  return shortcuts;
};

export const saveUserKeyboardShortcuts = async (shortcuts: Record<string, string>) => {
  const existing = await db.query.userKeyboardShortcuts.findFirst();

  if (existing) {
    await db
      .update(userKeyboardShortcuts)
      .set({
        shortcuts,
        updatedAt: new Date()
      })
      .where(eq(userKeyboardShortcuts.id, existing.id));
  } else {
    await db.insert(userKeyboardShortcuts).values({
      shortcuts
    });
  }
};

// ============================================================================
// Equalizer Preset Queries
// ============================================================================

export const getUserEqualizerPreset = async () => {
  const preset = await db.query.userEqualizerPreset.findFirst();

  if (!preset) throw new Error('User equalizer preset not found');

  return preset;
};

export const saveUserEqualizerPreset = async (presetData: {
  presetName?: string;
  frequencyBands?: number[];
  isEnabled?: boolean;
}) => {
  const existing = await db.query.userEqualizerPreset.findFirst();

  if (existing) {
    await db
      .update(userEqualizerPreset)
      .set({
        ...presetData,
        updatedAt: new Date()
      })
      .where(eq(userEqualizerPreset.id, existing.id));
  } else {
    await db.insert(userEqualizerPreset).values({
      presetName: presetData.presetName || 'Default',
      frequencyBands: presetData.frequencyBands || [],
      isEnabled: presetData.isEnabled || false
    });
  }
};

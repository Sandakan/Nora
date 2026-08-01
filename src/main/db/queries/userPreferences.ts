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

const EQUALIZER_BAND_COUNT = 10;
const EQUALIZER_MIN = -12;
const EQUALIZER_MAX = 12;

const clamp = (value: number) => Math.min(EQUALIZER_MAX, Math.max(EQUALIZER_MIN, value));

const validateEqualizerPresetData = (presetData: {
  presetName?: string;
  frequencyBands?: number[];
  preAmpValue?: number;
  isEnabled?: boolean;
}): { valid: true; data: Required<Pick<typeof presetData, 'frequencyBands' | 'preAmpValue'>> } | { valid: false } => {
  const { frequencyBands, preAmpValue } = presetData;

  if (
    !Array.isArray(frequencyBands) ||
    frequencyBands.length !== EQUALIZER_BAND_COUNT ||
    !frequencyBands.every((band) => typeof band === 'number' && Number.isFinite(band))
  ) {
    return { valid: false };
  }

  if (typeof preAmpValue !== 'number' || !Number.isFinite(preAmpValue)) {
    return { valid: false };
  }

  return {
    valid: true,
    data: {
      frequencyBands: frequencyBands.map(clamp),
      preAmpValue: clamp(preAmpValue)
    }
  };
};

export const saveUserEqualizerPreset = async (presetData: {
  presetName?: string;
  frequencyBands?: number[];
  preAmpValue?: number;
  isEnabled?: boolean;
}) => {
  const validation = validateEqualizerPresetData(presetData);
  if (!validation.valid) {
    throw new Error('Invalid equalizer preset payload: expected 10 finite band values and one finite pre-amp value');
  }
  const { frequencyBands, preAmpValue } = validation.data;

  const existing = await db.query.userEqualizerPreset.findFirst();
  if (existing) {
    await db
      .update(userEqualizerPreset)
      .set({
        ...presetData,
        frequencyBands,
        preAmpValue,
        updatedAt: new Date()
      })
      .where(eq(userEqualizerPreset.id, existing.id));
  } else {
    await db.insert(userEqualizerPreset).values({
      presetName: presetData.presetName || 'Default',
      frequencyBands,
      preAmpValue,
      isEnabled: presetData.isEnabled || false
    });
  }
};

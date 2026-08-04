const CROSSFADE_MAX_MS = 12000;
const CROSSFADE_STEP_MS = 500;

// Persisted crossfadeDuration can contain NaN, negatives, or out-of-range
// values (imports, older storage). Clamp + round to the slider's step before
// it reaches gain timing or the UI slider, keeping both surfaces on one rule.
export const normalizeCrossfadeDuration = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(
    CROSSFADE_MAX_MS,
    Math.max(0, Math.round(value / CROSSFADE_STEP_MS) * CROSSFADE_STEP_MS)
  );
};

import { getUserSettings } from '@main/db/queries/settings';

import logger from '../logger';
import { Initialize, setDiscordRPC } from './discord';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let latestData: DiscordActivity | null = null;

const DISCORD_STRING_MAX = 128;
const DISCORD_BUTTONS_MAX = 2;

const isSafeString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= DISCORD_STRING_MAX;

// Discord requires integer (Unix ms) timestamps. Fractional values can come
// from `now + duration * 1000` when duration is non-integer (VBR tracks), so
// accept any finite number and round to a safe integer instead of rejecting.
const isSafeTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER;

const roundTimestamp = (value: unknown): number => Math.round(value as number);

const isHttpsUrl = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('https://');

type ValidationResult = { ok: true; activity: DiscordActivity } | { ok: false; reason: string };

// Runtime validation of the IPC payload before it reaches the Discord RPC
// client. The preload type is compile-time only; malformed or hostile data
// must not be combined into a SET_ACTIVITY request.
export const validateDiscordActivity = (data: unknown): ValidationResult => {
  if (typeof data !== 'object' || data === null) {
    return { ok: false, reason: 'activity-not-object' };
  }
  const activity = data as Record<string, unknown>;

  if (activity.details !== undefined && !isSafeString(activity.details)) {
    return { ok: false, reason: 'details-invalid' };
  }
  if (activity.state !== undefined && !isSafeString(activity.state)) {
    return { ok: false, reason: 'state-invalid' };
  }

  if (activity.timestamps !== undefined) {
    if (typeof activity.timestamps !== 'object' || activity.timestamps === null) {
      return { ok: false, reason: 'timestamps-invalid' };
    }
    const timestamps = activity.timestamps as Record<string, unknown>;
    if (timestamps.start !== undefined && !isSafeTimestamp(timestamps.start)) {
      return { ok: false, reason: 'timestamp-start-invalid' };
    }
    if (timestamps.end !== undefined && !isSafeTimestamp(timestamps.end)) {
      return { ok: false, reason: 'timestamp-end-invalid' };
    }
    // Round fractional timestamps (VBR durations) to integer ms.
    if (timestamps.start !== undefined) timestamps.start = roundTimestamp(timestamps.start);
    if (timestamps.end !== undefined) timestamps.end = roundTimestamp(timestamps.end);
  }

  if (activity.assets !== undefined) {
    if (typeof activity.assets !== 'object' || activity.assets === null) {
      return { ok: false, reason: 'assets-invalid' };
    }
    const assets = activity.assets as Record<string, unknown>;
    for (const key of ['large_image', 'large_text', 'small_image', 'small_text']) {
      const value = assets[key];
      if (value !== undefined && !isSafeString(value)) {
        return { ok: false, reason: `asset-${key}-invalid` };
      }
    }
  }

  if (activity.buttons !== undefined) {
    if (!Array.isArray(activity.buttons) || activity.buttons.length > DISCORD_BUTTONS_MAX) {
      return { ok: false, reason: 'buttons-invalid' };
    }
    for (const button of activity.buttons) {
      if (typeof button !== 'object' || button === null) {
        return { ok: false, reason: 'button-not-object' };
      }
      const { label, url } = button as Record<string, unknown>;
      if (!isSafeString(label)) return { ok: false, reason: 'button-label-invalid' };
      if (!isHttpsUrl(url)) return { ok: false, reason: 'button-url-invalid' };
    }
  }

  return { ok: true, activity: activity as unknown as DiscordActivity };
};

export const setDiscordRpcActivity = async (data: DiscordActivity) => {
  try {
    const userSettings = await getUserSettings();
    const { enableDiscordRPC } = userSettings ?? {};

    if (!enableDiscordRPC)
      return logger.debug('Discord Rich Presence skipped.', {
        reason: { enableDiscordRPC }
      });
    Initialize();

    const validation = validateDiscordActivity(data);
    if (!validation.ok) {
      // Log a safe reason only; never serialize the unvalidated payload.
      return logger.warn('Discord activity payload rejected.', {
        reason: validation.reason
      });
    }

    if (debounceTimer) {
      latestData = validation.activity;
      return;
    }

    setDiscordRPC(validation.activity);

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const pending = latestData;
      latestData = null;
      if (pending) {
        logger.debug('Send last activity in the queue.');
        setDiscordRPC(pending);
      }
      logger.debug('Clear activity queue.');
    }, 1000);
  } catch (error) {
    logger.error('Failed to set discord rich presence activity.', { error });
  }
};

export const clearDiscordRpcActivity = async () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // Flush any pending data from the queue before clearing
  if (latestData) {
    setDiscordRPC(latestData);
  }

  latestData = null;
  setDiscordRPC(null);
};

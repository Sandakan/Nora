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
// accept any finite number, round to a safe integer, and verify the full
// safe-integer range (including the lower bound) after rounding.
const isSafeTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(Math.round(value));

const roundTimestamp = (value: unknown): number => Math.round(value as number);

// `startsWith('https://')` accepts malformed URLs like 'https://' with no
// host. Parse and require the HTTPS protocol + a non-empty hostname.
const isHttpsUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
};

type ValidationResult = { ok: true; activity: DiscordActivity } | { ok: false; reason: string };

// Runtime validation of the IPC payload before it reaches the Discord RPC
// client. The preload type is compile-time only; malformed or hostile data
// must not be combined into a SET_ACTIVITY request.
export const validateDiscordActivity = (data: unknown): ValidationResult => {
  // Reject arrays and non-plain objects. `typeof [] === 'object'` so an
  // explicit Array check is required.
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, reason: 'activity-not-object' };
  }
  const input = data as Record<string, unknown>;

  // Build the validated activity from an allow list so unknown fields and the
  // original input object (which may be mutated by reference elsewhere) do
  // not reach the Discord client.
  const activity: Record<string, unknown> = {};

  if (input.details !== undefined) {
    if (!isSafeString(input.details)) return { ok: false, reason: 'details-invalid' };
    activity.details = input.details;
  }
  if (input.state !== undefined) {
    if (!isSafeString(input.state)) return { ok: false, reason: 'state-invalid' };
    activity.state = input.state;
  }

  if (input.timestamps !== undefined) {
    if (
      typeof input.timestamps !== 'object' ||
      input.timestamps === null ||
      Array.isArray(input.timestamps)
    ) {
      return { ok: false, reason: 'timestamps-invalid' };
    }
    const tsInput = input.timestamps as Record<string, unknown>;
    const timestamps: Record<string, number> = {};

    if (tsInput.start !== undefined) {
      if (!isSafeTimestamp(tsInput.start)) return { ok: false, reason: 'timestamp-start-invalid' };
      timestamps.start = roundTimestamp(tsInput.start);
    }
    if (tsInput.end !== undefined) {
      if (!isSafeTimestamp(tsInput.end)) return { ok: false, reason: 'timestamp-end-invalid' };
      timestamps.end = roundTimestamp(tsInput.end);
    }
    activity.timestamps = timestamps;
  }

  if (input.assets !== undefined) {
    if (typeof input.assets !== 'object' || input.assets === null || Array.isArray(input.assets)) {
      return { ok: false, reason: 'assets-invalid' };
    }
    const assetsInput = input.assets as Record<string, unknown>;
    const assets: Record<string, string> = {};
    for (const key of ['large_image', 'large_text', 'small_image', 'small_text']) {
      const value = assetsInput[key];
      if (value !== undefined) {
        if (!isSafeString(value)) return { ok: false, reason: `asset-${key}-invalid` };
        assets[key] = value;
      }
    }
    activity.assets = assets;
  }

  if (input.buttons !== undefined) {
    if (!Array.isArray(input.buttons) || input.buttons.length > DISCORD_BUTTONS_MAX) {
      return { ok: false, reason: 'buttons-invalid' };
    }
    const buttons: Array<{ label: string; url: string }> = [];
    for (const button of input.buttons) {
      if (typeof button !== 'object' || button === null || Array.isArray(button)) {
        return { ok: false, reason: 'button-not-object' };
      }
      const btn = button as Record<string, unknown>;
      if (!isSafeString(btn.label)) return { ok: false, reason: 'button-label-invalid' };
      if (!isHttpsUrl(btn.url)) return { ok: false, reason: 'button-url-invalid' };
      buttons.push({ label: btn.label, url: btn.url });
    }
    activity.buttons = buttons;
  }

  return { ok: true, activity: activity as unknown as DiscordActivity };
};

export const setDiscordRpcActivity = async (data: DiscordActivity) => {
  try {
    // Validate BEFORE initializing the Discord connection so a malformed
    // payload does not start the connection lifecycle only to be rejected.
    const validation = validateDiscordActivity(data);
    if (!validation.ok) {
      return logger.warn('Discord activity payload rejected.', {
        reason: validation.reason
      });
    }

    const userSettings = await getUserSettings();
    const { enableDiscordRPC } = userSettings ?? {};

    if (!enableDiscordRPC)
      return logger.debug('Discord Rich Presence skipped.', {
        reason: { enableDiscordRPC }
      });
    Initialize();

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

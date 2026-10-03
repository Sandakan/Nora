import { describe, it, expect, vi } from 'vitest';

vi.mock('@main/db/queries/settings', () => ({
  getUserSettings: vi.fn().mockResolvedValue({ enableDiscordRPC: true })
}));

vi.mock('@main/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

vi.mock('@main/other/discord', () => ({
  Initialize: vi.fn(),
  setDiscordRPC: vi.fn()
}));

import { validateDiscordActivity } from '@main/other/discordRPC';

describe('validateDiscordActivity', () => {
  it('accepts a valid payload', () => {
    const result = validateDiscordActivity({
      details: 'Song title',
      state: 'Artist',
      timestamps: { start: 1610000000000, end: 1610000030000 },
      assets: { large_image: 'art', small_image: 'icon', large_text: 'Album', small_text: 'Song' },
      buttons: [{ label: 'View', url: 'https://example.com' }]
    });
    expect(result.ok).toBe(true);
  });

  it('accepts activity with only optional fields present', () => {
    const result = validateDiscordActivity({ details: 'd' });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-object payload', () => {
    expect(validateDiscordActivity(null).ok).toBe(false);
    expect(validateDiscordActivity('nope').ok).toBe(false);
    expect(validateDiscordActivity(42).ok).toBe(false);
  });

  it('rejects overly long details/state strings', () => {
    expect(validateDiscordActivity({ details: 'x'.repeat(200) }).ok).toBe(false);
    expect(validateDiscordActivity({ details: 'd', state: 'y'.repeat(200) }).ok).toBe(false);
  });

  it('rejects non-finite timestamps and rounds fractional ones', () => {
    expect(validateDiscordActivity({ timestamps: { start: NaN } }).ok).toBe(false);
    expect(validateDiscordActivity({ timestamps: { end: Infinity } }).ok).toBe(false);

    const result = validateDiscordActivity({ timestamps: { start: 1.5, end: 12.7 } });
    if (!result.ok) throw new Error(`expected ok, got ${result.reason}`);
    expect(result.activity.timestamps?.start).toBe(2);
    expect(result.activity.timestamps?.end).toBe(13);
  });

  it('rejects out-of-range timestamps after rounding', () => {
    expect(validateDiscordActivity({ timestamps: { start: -1e100 } }).ok).toBe(false);
    expect(
      validateDiscordActivity({ timestamps: { start: Number.MIN_SAFE_INTEGER - 1 } }).ok
    ).toBe(false);
    expect(
      validateDiscordActivity({ timestamps: { end: Number.MAX_SAFE_INTEGER + 1 } }).ok
    ).toBe(false);
  });

  it('rejects malformed https URLs (no host)', () => {
    expect(validateDiscordActivity({ buttons: [{ label: 'x', url: 'https://' }] }).ok).toBe(
      false
    );
    expect(validateDiscordActivity({ buttons: [{ label: 'x', url: 'https://?value=x' }] }).ok).toBe(
      false
    );
  });

  it('rejects arrays and non-plain objects as the activity', () => {
    expect(validateDiscordActivity([]).ok).toBe(false);
    expect(validateDiscordActivity([{ details: 'd' }]).ok).toBe(false);
  });

  it('does not mutate the input object', () => {
    const input = { timestamps: { start: 1.5, end: 12.7 } };
    const result = validateDiscordActivity(input);
    if (!result.ok) throw new Error(`expected ok, got ${result.reason}`);
    expect(input.timestamps.start).toBe(1.5);
    expect(input.timestamps.end).toBe(12.7);
  });

  it('rejects too many buttons', () => {
    expect(
      validateDiscordActivity({
        buttons: [
          { label: 'a', url: 'https://x.com' },
          { label: 'b', url: 'https://x.com' },
          { label: 'c', url: 'https://x.com' }
        ]
      }).ok
    ).toBe(false);
  });

  it('rejects buttons with an empty label', () => {
    expect(validateDiscordActivity({ buttons: [{ label: '', url: 'https://x.com' }] }).ok).toBe(
      false
    );
  });

  it('rejects button URLs that are not https', () => {
    expect(validateDiscordActivity({ buttons: [{ label: 'x', url: 'http://x.com' }] }).ok).toBe(
      false
    );
    expect(
      validateDiscordActivity({ buttons: [{ label: 'x', url: 'javascript:alert(1)' }] }).ok
    ).toBe(false);
  });

  it('rejects non-plain objects (Date, URL, class instance) at the top level', () => {
    expect(validateDiscordActivity(new Date()).ok).toBe(false);
    expect(validateDiscordActivity(new URL('https://example.com')).ok).toBe(false);
    expect(validateDiscordActivity(new (class {})()).ok).toBe(false);
  });

  it('rejects non-plain nested timestamps, assets, and button objects', () => {
    expect(validateDiscordActivity({ timestamps: new Date() }).ok).toBe(false);
    expect(validateDiscordActivity({ timestamps: new URL('https://x.com') }).ok).toBe(false);
    expect(validateDiscordActivity({ assets: new Date() }).ok).toBe(false);
    expect(validateDiscordActivity({ buttons: [new Date() as unknown as object] }).ok).toBe(false);
  });

  it('rejects a non-plain activity but accepts a null-prototype plain record', () => {
    const nullProto = Object.create(null);
    nullProto.details = 'ok';
    expect(validateDiscordActivity(nullProto).ok).toBe(true);
    expect(validateDiscordActivity(Object.create({})).ok).toBe(false);
  });
});

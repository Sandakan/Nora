import { describe, it, expect } from 'vitest';

import { normalizeCrossfadeDuration } from '../../../../../src/renderer/src/utils/normalizeCrossfadeDuration';

describe('normalizeCrossfadeDuration', () => {
  it('returns 0 for non-finite values (NaN, Infinity, non-number)', () => {
    expect(normalizeCrossfadeDuration(NaN)).toBe(0);
    expect(normalizeCrossfadeDuration(Infinity)).toBe(0);
    expect(normalizeCrossfadeDuration(-Infinity)).toBe(0);
    expect(normalizeCrossfadeDuration('500' as unknown)).toBe(0);
    expect(normalizeCrossfadeDuration(null as unknown)).toBe(0);
    expect(normalizeCrossfadeDuration(undefined as unknown)).toBe(0);
  });

  it('clamps negative values to 0', () => {
    expect(normalizeCrossfadeDuration(-200)).toBe(0);
    expect(normalizeCrossfadeDuration(-5000)).toBe(0);
  });

  it('clamps values above the 12000ms max', () => {
    expect(normalizeCrossfadeDuration(15000)).toBe(12000);
    expect(normalizeCrossfadeDuration(12001)).toBe(12000);
    expect(normalizeCrossfadeDuration(99999)).toBe(12000);
  });

  it('rounds to the nearest 500ms step', () => {
    expect(normalizeCrossfadeDuration(0)).toBe(0);
    expect(normalizeCrossfadeDuration(250)).toBe(500);
    expect(normalizeCrossfadeDuration(500)).toBe(500);
    expect(normalizeCrossfadeDuration(749)).toBe(500);
    expect(normalizeCrossfadeDuration(750)).toBe(1000);
    expect(normalizeCrossfadeDuration(3450)).toBe(3500);
  });

  it('passes through already-valid step values', () => {
    expect(normalizeCrossfadeDuration(3000)).toBe(3000);
    expect(normalizeCrossfadeDuration(12000)).toBe(12000);
  });

  it('treats 0 as the explicit disabled state', () => {
    expect(normalizeCrossfadeDuration(0)).toBe(0);
    expect(normalizeCrossfadeDuration(1)).toBe(0);
  });
});

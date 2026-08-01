import { describe, test, expect } from 'vitest';

import {
  validateSmartPlaylistCriteria,
  validateSmartPlaylistRule
} from '@main/db/queries/validateSmartPlaylistCriteria';

const validRule = { field: 'genre', operator: 'eq', value: 'Rock' };

describe('validateSmartPlaylistRule', () => {
  test('accepts a valid string rule', () => {
    expect(validateSmartPlaylistRule(validRule)).toEqual({ success: true });
  });

  test('accepts a valid numeric rule', () => {
    expect(validateSmartPlaylistRule({ field: 'year', operator: 'gt', value: 2000 })).toEqual({
      success: true
    });
  });

  test('accepts a valid boolean rule', () => {
    expect(validateSmartPlaylistRule({ field: 'isFavorite', operator: 'eq', value: true })).toEqual({
      success: true
    });
  });

  test('rejects null rule objects', () => {
    const result = validateSmartPlaylistRule(null);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('rule-not-object');
  });

  test('rejects unknown fields', () => {
    const result = validateSmartPlaylistRule({ field: 'unknown', operator: 'eq', value: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-field');
  });

  test('rejects invalid operator for field', () => {
    const result = validateSmartPlaylistRule({ field: 'genre', operator: 'gt', value: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-operator');
  });

  test('rejects non-numeric value for numeric field', () => {
    const result = validateSmartPlaylistRule({ field: 'year', operator: 'eq', value: 'not-a-number' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-numeric-value');
  });

  test('rejects non-finite numeric value', () => {
    const result = validateSmartPlaylistRule({ field: 'year', operator: 'eq', value: Infinity });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-numeric-value');
  });

  test('rejects invalid boolean value', () => {
    const result = validateSmartPlaylistRule({ field: 'isFavorite', operator: 'eq', value: 'yes' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-boolean-value');
  });

  test('rejects unbounded string values', () => {
    const result = validateSmartPlaylistRule({
      field: 'genre',
      operator: 'eq',
      value: 'x'.repeat(201)
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-string-value');
  });

  test('rejects empty string values', () => {
    const result = validateSmartPlaylistRule({ field: 'genre', operator: 'eq', value: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-string-value');
  });

  test('rejects whitespace-only string values', () => {
    const result = validateSmartPlaylistRule({ field: 'genre', operator: 'eq', value: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-string-value');
  });
});

describe('validateSmartPlaylistCriteria', () => {
  test('accepts valid criteria', () => {
    const criteria = { matchType: 'ALL', rules: [validRule] };
    expect(validateSmartPlaylistCriteria(criteria)).toEqual({ success: true });
  });

  test('rejects non-object criteria', () => {
    expect(validateSmartPlaylistCriteria(null).success).toBe(false);
    expect(validateSmartPlaylistCriteria('string').success).toBe(false);
  });

  test('rejects invalid matchType', () => {
    const criteria = { matchType: 'SOME', rules: [validRule] };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-match-type');
  });

  test('rejects empty rules array', () => {
    const criteria = { matchType: 'ALL', rules: [] };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('empty-rules');
  });

  test('rejects missing rules', () => {
    const criteria = { matchType: 'ALL' };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('empty-rules');
  });

  test('rejects null entries in rules', () => {
    const criteria = { matchType: 'ALL', rules: [null] };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('rule-not-object');
  });

  test('rejects too many rules', () => {
    const rules = Array.from({ length: 21 }, () => validRule);
    const result = validateSmartPlaylistCriteria({ matchType: 'ALL', rules });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('too-many-rules');
  });

  test('rejects invalid limit', () => {
    const criteria = { matchType: 'ALL', rules: [validRule], limit: 0 };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-limit');
  });

  test('rejects fractional limit', () => {
    const criteria = { matchType: 'ALL', rules: [validRule], limit: 10.5 };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-limit');
  });

  test('rejects excessive limit', () => {
    const criteria = { matchType: 'ALL', rules: [validRule], limit: 101 };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('invalid-limit');
  });

  test('rejects criteria carrying lastFmSource (rule-driven mode only)', () => {
    const criteria = { matchType: 'ALL', rules: [validRule], lastFmSource: { username: 'x' } };
    const result = validateSmartPlaylistCriteria(criteria);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toBe('lastfm-source-not-allowed');
  });

  test('accepts bounded valid limit', () => {
    const criteria = { matchType: 'ALL', rules: [validRule], limit: 50 };
    expect(validateSmartPlaylistCriteria(criteria)).toEqual({ success: true });
  });
});

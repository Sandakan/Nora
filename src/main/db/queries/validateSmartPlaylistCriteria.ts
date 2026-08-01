const NUMERIC_FIELDS = new Set([
  'year',
  'playCount',
  'skipCount',
  'lastPlayed',
  'duration',
  'bitRate'
]);

const STRING_FIELDS = new Set(['genre', 'artist', 'album']);

const BOOLEAN_FIELDS = new Set(['isFavorite', 'isBlacklisted']);

const EQ_OPERATORS = new Set(['eq', 'neq']);

const NUMERIC_OPERATORS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte']);

const MAX_RULES = 20;
const MAX_STRING_LENGTH = 200;
const MAX_LIMIT = 100;

export type CriteriaValidationResult =
  | { success: true }
  | { success: false; reason: string };

export const validateSmartPlaylistCriteria = (
  criteria: unknown
): CriteriaValidationResult => {
  if (!criteria || typeof criteria !== 'object') {
    return { success: false, reason: 'criteria-not-object' };
  }

  const c = criteria as SmartPlaylistCriteria;

  if (c.matchType !== 'ALL' && c.matchType !== 'ANY') {
    return { success: false, reason: 'invalid-match-type' };
  }

  // Rule-driven criteria must not carry the Last.fm ownership marker. That
  // property is only written by the atomic sync endpoint, which validates it.
  if (Object.prototype.hasOwnProperty.call(c, 'lastFmSource')) {
    return { success: false, reason: 'lastfm-source-not-allowed' };
  }

  if (!Array.isArray(c.rules) || c.rules.length === 0) {
    return { success: false, reason: 'empty-rules' };
  }

  if (c.rules.length > MAX_RULES) {
    return { success: false, reason: 'too-many-rules' };
  }

  for (const rule of c.rules) {
    const ruleResult = validateSmartPlaylistRule(rule);
    if (!ruleResult.success) return ruleResult;
  }

  if (c.limit !== undefined) {
    if (typeof c.limit !== 'number' || !Number.isInteger(c.limit) || c.limit <= 0 || c.limit > MAX_LIMIT) {
      return { success: false, reason: 'invalid-limit' };
    }
  }

  return { success: true };
};

export const validateSmartPlaylistRule = (
  rule: unknown
): CriteriaValidationResult => {
  if (!rule || typeof rule !== 'object') {
    return { success: false, reason: 'rule-not-object' };
  }

  const r = rule as SmartPlaylistRule;

  if (typeof r.field !== 'string' || !isKnownField(r.field)) {
    return { success: false, reason: 'invalid-field' };
  }

  if (typeof r.operator !== 'string' || !isValidOperator(r.field, r.operator)) {
    return { success: false, reason: 'invalid-operator' };
  }

  if (NUMERIC_FIELDS.has(r.field)) {
    if (typeof r.value !== 'number' || !Number.isFinite(r.value)) {
      return { success: false, reason: 'invalid-numeric-value' };
    }
  }

  if (STRING_FIELDS.has(r.field)) {
    if (
      typeof r.value !== 'string' ||
      r.value.trim().length === 0 ||
      r.value.length > MAX_STRING_LENGTH
    ) {
      return { success: false, reason: 'invalid-string-value' };
    }
  }

  if (BOOLEAN_FIELDS.has(r.field)) {
    if (typeof r.value !== 'boolean' && r.value !== 'true' && r.value !== 'false') {
      return { success: false, reason: 'invalid-boolean-value' };
    }
  }

  return { success: true };
};

const isKnownField = (field: string): field is SmartPlaylistRuleField => {
  return (
    NUMERIC_FIELDS.has(field) ||
    STRING_FIELDS.has(field) ||
    BOOLEAN_FIELDS.has(field)
  );
};

const VALID_PERIODS = ['overall', '7day', '1month', '3month', '6month', '12month'];
const MAX_USERNAME_LENGTH = 200;

export type LastFmSourceValidationResult =
  | { success: true }
  | { success: false; reason: string };

export const validateLastFmSource = (source: unknown): LastFmSourceValidationResult => {
  if (!source || typeof source !== 'object') {
    return { success: false, reason: 'lastfm-source-not-object' };
  }
  const s = source as Record<string, unknown>;

  if (typeof s.username !== 'string' || s.username.trim().length === 0 || s.username.trim().length > MAX_USERNAME_LENGTH) {
    return { success: false, reason: 'invalid-lastfm-username' };
  }

  if (s.type !== 'top' && s.type !== 'recent' && s.type !== 'loved') {
    return { success: false, reason: 'invalid-lastfm-type' };
  }

  if (s.period !== undefined && typeof s.period === 'string' && !VALID_PERIODS.includes(s.period)) {
    return { success: false, reason: 'invalid-lastfm-period' };
  }

  if (s.limit !== undefined && (typeof s.limit !== 'number' || !Number.isSafeInteger(s.limit) || s.limit <= 0 || s.limit > MAX_LIMIT)) {
    return { success: false, reason: 'invalid-lastfm-limit' };
  }

  return { success: true };
};

const isValidOperator = (field: SmartPlaylistRuleField, operator: string): boolean => {
  if (STRING_FIELDS.has(field)) {
    return operator === 'eq' || operator === 'neq' || operator === 'contains';
  }
  if (NUMERIC_FIELDS.has(field)) {
    return NUMERIC_OPERATORS.has(operator);
  }
  if (BOOLEAN_FIELDS.has(field)) {
    return EQ_OPERATORS.has(operator);
  }
  return false;
};

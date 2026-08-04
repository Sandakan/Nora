import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from './Button';

interface SmartPlaylistCriteriaEditorProps {
  playlist: Playlist;
}

const FIELDS: SmartPlaylistRuleField[] = [
  'genre',
  'artist',
  'album',
  'year',
  'playCount',
  'skipCount',
  'lastPlayed',
  'isFavorite',
  'isBlacklisted',
  'duration',
  'bitRate'
];

function defaultRule(): SmartPlaylistRule & { id: string } {
  return { id: crypto.randomUUID(), field: 'genre', operator: 'eq', value: '' };
}

function defaultCriteria(): SmartPlaylistCriteria {
  return { matchType: 'ALL', rules: [defaultRule()] };
}

function isValidCriteriaShape(value: unknown): value is SmartPlaylistCriteria {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<SmartPlaylistCriteria>;
  if (v.matchType !== 'ALL' && v.matchType !== 'ANY') return false;
  if (!Array.isArray(v.rules)) return false;
  return v.rules.every(
    (r) =>
      r &&
      typeof r === 'object' &&
      typeof (r as SmartPlaylistRule).field === 'string' &&
      typeof (r as SmartPlaylistRule).operator === 'string'
  );
}

const SmartPlaylistCriteriaEditor = (props: SmartPlaylistCriteriaEditorProps) => {
  const { playlist } = props;
  const { t } = useTranslation();
  const { addNewNotifications, changePromptMenuData } = useContext(AppUpdateContext);

  const initialCriteria = useMemo(() => {
    if (playlist.criteria) {
      try {
        const parsed = JSON.parse(playlist.criteria);
        if (isValidCriteriaShape(parsed)) return parsed;
      } catch {
        // fall through to default below
      }
    }
    return defaultCriteria();
  }, [playlist.criteria]);

  const [criteria, setCriteria] = useState<SmartPlaylistCriteria>(initialCriteria);
  const [isSaving, setIsSaving] = useState(false);

  const fieldLabel = useCallback(
    (f: SmartPlaylistRuleField): string => {
      const map: Record<SmartPlaylistRuleField, string> = {
        genre: t('playlist.fieldGenre'),
        artist: t('playlist.fieldArtist'),
        album: t('playlist.fieldAlbum'),
        year: t('playlist.fieldYear'),
        playCount: t('playlist.fieldPlayCount'),
        skipCount: t('playlist.fieldSkipCount'),
        lastPlayed: t('playlist.fieldLastPlayed'),
        isFavorite: t('playlist.fieldIsFavorite'),
        isBlacklisted: t('playlist.fieldIsBlacklisted'),
        duration: t('playlist.fieldDuration'),
        bitRate: t('playlist.fieldBitRate')
      };
      return map[f];
    },
    [t]
  );

  const operatorLabel = useCallback(
    (op: SmartPlaylistRuleOperator): string => {
      const map: Record<SmartPlaylistRuleOperator, string> = {
        eq: t('playlist.operatorEq'),
        neq: t('playlist.operatorNeq'),
        gt: t('playlist.operatorGt'),
        gte: t('playlist.operatorGte'),
        lt: t('playlist.operatorLt'),
        lte: t('playlist.operatorLte'),
        contains: t('playlist.operatorContains')
      };
      return map[op];
    },
    [t]
  );

  const updateRule = useCallback(
    (index: number, field: keyof SmartPlaylistRule, value: unknown) => {
      setCriteria((prev) => {
        const newRules = [...prev.rules];
        newRules[index] = { ...newRules[index], [field]: value };
        return { ...prev, rules: newRules };
      });
    },
    []
  );

  const removeRule = useCallback((index: number) => {
    setCriteria((prev) => {
      const newRules = prev.rules.filter((_, i) => i !== index);
      return { ...prev, rules: newRules.length > 0 ? newRules : [defaultRule()] };
    });
  }, []);

  const addRule = useCallback(() => {
    setCriteria((prev) => ({
      ...prev,
      rules: [...prev.rules, defaultRule()]
    }));
  }, []);

  const saveCriteria = useCallback(async () => {
    if (isSaving) return;
    const cleanRules = criteria.rules
      .filter((r) => r.value !== undefined && String(r.value).trim().length > 0)
      .map((r) => {
        const { id: _key, ...rule } = r as SmartPlaylistRule & { id?: string };
        void _key;
        if (
          typeof rule.value === 'string' &&
          rule.value.trim() !== '' &&
          !needsStringOps(rule.field) &&
          !needsBoolOps(rule.field)
        ) {
          return { ...rule, value: Number(rule.value) };
        }
        return rule;
      });
    if (cleanRules.length === 0) {
      addNewNotifications([
        { id: 'smartPlaylistNoRules', duration: 3000, content: t('playlist.criteriaSaveFailed') }
      ]);
      return;
    }
    const cleaned: SmartPlaylistCriteria = {
      matchType: criteria.matchType,
      rules: cleanRules,
      ...(criteria.limit !== undefined ? { limit: criteria.limit } : {})
    };

    setIsSaving(true);
    try {
      const result = await window.api.playlistsData.saveSmartPlaylistCriteria(
        playlist.playlistId,
        cleaned
      );
      if (result.success) {
        addNewNotifications([
          {
            id: 'smartPlaylistCriteriaSaved',
            duration: 5000,
            content: t('playlist.criteriaSaveSuccess')
          }
        ]);
        changePromptMenuData(false);
      } else {
        addNewNotifications([
          {
            id: 'smartPlaylistSaveFailed',
            duration: 5000,
            content: t('playlist.criteriaSaveFailed')
          }
        ]);
      }
    } finally {
      setIsSaving(false);
    }
  }, [addNewNotifications, changePromptMenuData, criteria, isSaving, playlist.playlistId, t]);

  const needsBoolOps = (field: SmartPlaylistRuleField) =>
    ['isFavorite', 'isBlacklisted'].includes(field);

  const needsStringOps = (field: SmartPlaylistRuleField) =>
    ['genre', 'artist', 'album'].includes(field);

  const availableOps = (field: SmartPlaylistRuleField): SmartPlaylistRuleOperator[] => {
    if (needsStringOps(field)) return ['eq', 'neq', 'contains'];
    if (needsBoolOps(field)) return ['eq', 'neq'];
    return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
  };

  const inputForRule = (rule: SmartPlaylistRule, idx: number) => {
    const onChange = (val: unknown) => updateRule(idx, 'value', val);

    if (needsBoolOps(rule.field)) {
      return (
        <select
          className="bg-background-color-2 text-font-color-black focus:outline-font-color-highlight dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:outline-dark-font-color-highlight mt-1 w-full rounded-lg px-3 py-1.5 text-sm outline-1 outline-transparent transition-colors"
          value={String(rule.value)}
          onChange={(e) => onChange(e.target.value === 'true')}
        >
          <option value="true">{t('playlist.valueTrue')}</option>
          <option value="false">{t('playlist.valueFalse')}</option>
        </select>
      );
    }

    if (needsStringOps(rule.field)) {
      return (
        <input
          type="text"
          className="bg-background-color-2 text-font-color-black focus:outline-font-color-highlight dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:outline-dark-font-color-highlight mt-1 w-full rounded-lg px-3 py-1.5 text-sm outline-1 outline-transparent transition-colors"
          value={String(rule.value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('playlist.criteriaValuePlaceholder')}
        />
      );
    }

    return (
      <input
        type="number"
        className="bg-background-color-2 text-font-color-black focus:outline-font-color-highlight dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:outline-dark-font-color-highlight mt-1 w-full rounded-lg px-3 py-1.5 text-sm outline-1 outline-transparent transition-colors"
        value={String(rule.value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('playlist.criteriaValuePlaceholder')}
      />
    );
  };

  return (
    <div className="smart-playlist-criteria-editor bg-background-color-2 dark:bg-dark-background-color-2 flex max-h-[80vh] w-[90vw] max-w-[32rem] flex-col rounded-lg px-6 py-5 shadow-lg">
      <div className="title-container mb-4 flex items-center justify-between">
        <h3 className="text-font-color-black dark:text-font-color-white text-2xl font-semibold">
          {playlist.name}
        </h3>
        <span className="material-icons-round text-font-color-highlight dark:text-dark-font-color-highlight text-lg">
          auto_awesome
        </span>
      </div>

      <div className="match-type-toggle mb-4 flex items-center gap-3">
        <label className="text-font-color-black dark:text-font-color-white flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="matchType"
            checked={criteria.matchType === 'ALL'}
            onChange={() => setCriteria((prev) => ({ ...prev, matchType: 'ALL' }))}
          />
          {t('playlist.matchTypeAll')}
        </label>
        <label className="text-font-color-black dark:text-font-color-white flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="matchType"
            checked={criteria.matchType === 'ANY'}
            onChange={() => setCriteria((prev) => ({ ...prev, matchType: 'ANY' }))}
          />
          {t('playlist.matchTypeAny')}
        </label>
      </div>

      <div className="rules-list flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
        {criteria.rules.map((rule, idx) => (
          <div
            key={(rule as SmartPlaylistRule & { id?: string }).id ?? idx}
            className="rule-row bg-background-color-1 dark:bg-dark-background-color-1 flex flex-wrap items-end gap-2 rounded-lg p-3"
          >
            <div className="flex flex-1 flex-col">
              <label className="text-font-color-dimmed dark:text-dark-font-color-dimmed text-xs">
                {t('playlist.ruleField')}
              </label>
              <select
                className="bg-background-color-2 text-font-color-black focus:outline-font-color-highlight dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:outline-dark-font-color-highlight mt-1 rounded-lg px-3 py-1.5 text-sm outline-1 outline-transparent transition-colors"
                value={rule.field}
                onChange={(e) => {
                  const field = e.target.value as SmartPlaylistRuleField;
                  const ops = availableOps(field);
                  updateRule(idx, 'field', field);
                  if (!ops.includes(rule.operator)) {
                    updateRule(idx, 'operator', 'eq');
                  }
                }}
              >
                {FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {fieldLabel(f)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 flex-col">
              <label className="text-font-color-dimmed dark:text-dark-font-color-dimmed text-xs">
                {t('playlist.ruleOperator')}
              </label>
              <select
                className="bg-background-color-2 text-font-color-black focus:outline-font-color-highlight dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:outline-dark-font-color-highlight mt-1 rounded-lg px-3 py-1.5 text-sm outline-1 outline-transparent transition-colors"
                value={rule.operator}
                onChange={(e) =>
                  updateRule(idx, 'operator', e.target.value as SmartPlaylistRuleOperator)
                }
              >
                {availableOps(rule.field).map((op) => (
                  <option key={op} value={op}>
                    {operatorLabel(op)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-[1.5] flex-col">
              <label className="text-font-color-dimmed dark:text-dark-font-color-dimmed text-xs">
                {t('playlist.ruleValue')}
              </label>
              {inputForRule(rule, idx)}
            </div>

            <button
              className="material-icons-round text-font-color-dimmed hover:bg-background-color-3 hover:text-font-color-black focus:outline-font-color-highlight dark:text-dark-font-color-dimmed dark:hover:bg-dark-background-color-3 dark:hover:text-font-color-white dark:focus:outline-dark-font-color-highlight mt-1 flex h-9 w-9 items-center justify-center rounded-lg outline-1 outline-transparent transition-colors"
              onClick={() => removeRule(idx)}
              title={t('playlist.removeRule')}
              aria-label={t('playlist.removeRule')}
            >
              close
            </button>
          </div>
        ))}
      </div>

      <button
        className="bg-background-color-1 text-font-color-black hover:bg-background-color-3 focus:outline-font-color-highlight dark:bg-dark-background-color-1 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:focus:outline-dark-font-color-highlight mt-3 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm outline-1 outline-transparent transition-colors"
        onClick={addRule}
      >
        <span className="material-icons-round text-base">add</span>
        {t('playlist.addRule')}
      </button>

      <div className="actions mt-5 flex items-center justify-end gap-3">
        <Button
          className="rounded-lg! px-6! py-2!"
          label={t('common.cancel')}
          clickHandler={() => changePromptMenuData(false)}
          isDisabled={isSaving}
        />
        <Button
          className="bg-font-color-highlight! dark:bg-dark-font-color-highlight! rounded-lg! px-6! py-2! text-white!"
          label={t('common.save')}
          clickHandler={saveCriteria}
          isDisabled={isSaving}
        />
      </div>
    </div>
  );
};

export default SmartPlaylistCriteriaEditor;

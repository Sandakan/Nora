import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from '@renderer/other/appReducer';
import {
  type CSSProperties,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import { useUserPreferences } from '../../../hooks/useUserPreferences';
import i18n from '../../../i18n';
import { equalizerBandHertzData, equalizerPresetsData } from '../../../other/equalizerData';
import { isDataChanged } from '../../../utils/hasDataChanged';
import Button from '../../Button';
import Dropdown from '../../Dropdown';
import EqualierBand from './EqualierBand';

const presets: EqualizerPresetDropdownOptions[] = equalizerPresetsData.map((presetData) => {
  return {
    label: i18n.t(`equalizerPresets.${presetData.title}`),
    value: presetData.title,
    preset: presetData.preset
  };
});

const equalizerPresets: EqualizerPresetDropdownOptions[] = [
  {
    label: i18n.t('equalizerPresets.custom'),
    value: 'custom',
    isDisabled: true
  },
  ...presets
];

const equalizerBandKeys: (keyof Equalizer)[] = [
  'thirtyTwoHertzFilter',
  'sixtyFourHertzFilter',
  'hundredTwentyFiveHertzFilter',
  'twoHundredFiftyHertzFilter',
  'fiveHundredHertzFilter',
  'thousandHertzFilter',
  'twoThousandHertzFilter',
  'fourThousandHertzFilter',
  'eightThousandHertzFilter',
  'sixteenThousandHertzFilter'
];

type Action = { type: undefined; data: Equalizer } | { type: keyof Equalizer; data: number };

function reducer(state: Equalizer, action: Action): Equalizer {
  if (action.type === undefined) return action.data;
  if (action.type in state && typeof action.data === 'number') {
    return {
      ...state,
      [action.type]: action.data
    };
  }
  return state;
}

const getPresetName = (equalizer: Equalizer): string => {
  for (const presetData of equalizerPresets) {
    if (presetData.preset) {
      const { preset, value } = presetData;

      const isTheSamePresets = !isDataChanged(preset, equalizer);
      if (isTheSamePresets) return value;
    }
  }
  return 'custom';
};

const EqualizerSettings = () => {
  const { updateEqualizerOptions } = useContext(AppUpdateContext);
  const { equalizerPreset } = useUserPreferences();
  const { t } = useTranslation();

  const [content, dispatch] = useReducer(reducer, LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset);

  const [selectedPreset, setSelectedPreset] = useState<string>('flat');
  const [preAmpInputValue, setPreAmpInputValue] = useState(
    (LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset.preAmpValue ?? 0).toFixed(1)
  );
  const [isPreAmpFocused, setIsPreAmpFocused] = useState(false);
  const hasHydratedFromDatabaseRef = useRef(false);
  const shouldSkipNextSaveRef = useRef(true);

  const isTheDefaultPreset = useMemo(() => selectedPreset === 'flat', [selectedPreset]);

  // Re-sync the pre-amp display when the value changes from outside (preset
  // load, slider) while its number input is not being edited.
  useEffect(() => {
    if (!isPreAmpFocused) setPreAmpInputValue((content.preAmpValue ?? 0).toFixed(1));
  }, [content.preAmpValue, isPreAmpFocused]);

  useEffect(() => {
    const bands = equalizerPreset?.frequencyBands;

    if (hasHydratedFromDatabaseRef.current || !bands || bands.length !== equalizerBandKeys.length) {
      return;
    }

    const hydratedEqualizer = { ...LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset };

    equalizerBandKeys.forEach((key, index) => {
      hydratedEqualizer[key] = bands[index] ?? 0;
    });
    hydratedEqualizer.preAmpValue = equalizerPreset.preAmpValue ?? 0;

    hasHydratedFromDatabaseRef.current = true;
    shouldSkipNextSaveRef.current = true;
    dispatch({ type: undefined, data: hydratedEqualizer });
  }, [equalizerPreset]);

  useEffect(() => {
    setSelectedPreset(getPresetName(content));

    if (shouldSkipNextSaveRef.current) {
      shouldSkipNextSaveRef.current = false;
      return;
    }

    // Avoid overwriting DB with template defaults before we hydrate with DB values.
    if (!hasHydratedFromDatabaseRef.current) {
      return;
    }

    updateEqualizerOptions(content);
  }, [content, updateEqualizerOptions]);

  const equalizerBands = useMemo(() => {
    const bands: ReactNode[] = [];

    for (const [filterName, filterValue] of Object.entries(content)) {
      const equalizerFilterName = filterName as keyof Equalizer;
      const filterHertzValue = (equalizerBandHertzData as Record<string, number>)[
        equalizerFilterName
      ];

      if (filterHertzValue) {
        bands.push(
          <EqualierBand
            key={equalizerFilterName}
            value={filterValue}
            hertzValue={filterHertzValue}
            onChange={(val) => {
              dispatch({ type: equalizerFilterName, data: val });
            }}
          />
        );
      }
    }
    return bands;
  }, [content]);

  return (
    <li
      className="main-container equalizer-settings-container mb-12"
      id="equalizer-settings-container"
    >
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">graphic_eq</span>
        {t('settingsPage.equalizer')}
      </div>
      <div className="pl-6">
        <div className="flex items-center justify-between">
          <Dropdown
            name="EqualizerPresetsDropdown"
            options={equalizerPresets}
            value={selectedPreset}
            onChange={(e) => {
              const presetValue = e.currentTarget.value as EqualierPresetDropdownOptionValues;

              for (const preset of equalizerPresets) {
                if (preset.value === presetValue && preset.preset) {
                  dispatch({ type: undefined, data: preset.preset });
                }
              }
            }}
          />
          <Button
            label={t('settingsPage.reset')}
            iconName="restart_alt"
            isDisabled={isTheDefaultPreset}
            clickHandler={() => {
              const defaultPreset = equalizerPresets[1].preset;
              if (defaultPreset) {
                dispatch({ type: undefined, data: defaultPreset });
              }
            }}
          />
        </div>

        <div
          id="equalizer"
          className="equalizer relative mx-auto mt-4 flex max-w-6xl items-center justify-around px-8"
        >
          <span className="zero-line bg-background-color-2 dark:bg-dark-background-color-2 absolute mb-8 ml-12 h-0.5! w-[85%]! opacity-75" />
          <div className="section flex h-full! flex-col px-2 py-4 text-xs opacity-80">
            <span className="mb-20">+12dB</span>
            <span className="">0dB</span>
            <span className="mt-20 mb-8">-12dB</span>
          </div>
          <div className="section mx-6 flex flex-col text-center xl:mx-2" style={{ '--equalizer-band': `${((content.preAmpValue + 12) / 24) * 100}%` } as CSSProperties}>
            <div className="sliders flex flex-col items-center">
              <div className="range-slider flex h-60 w-full max-w-[1.75rem] flex-col items-center justify-end pt-2">
                <input
                  type="range"
                  className="vertical thumb-visible before:bg-font-color-highlight hover:before:bg-font-color-highlight dark:before:bg-dark-font-color-highlight dark:hover:before:bg-dark-font-color-highlight h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-hidden outline-offset-1 before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--equalizer-band)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:transition-[width,background] before:content-[''] focus-visible:outline!"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={content.preAmpValue}
                  onChange={(e) => {
                    dispatch({ type: 'preAmpValue', data: e.currentTarget.valueAsNumber });
                  }}
                />
                <span className="scope-min mt-24 text-xs font-medium opacity-80">Pre</span>
                <input
                  type="number"
                  className="equalizer-band-input mt-1 w-full rounded border border-background-color-3 bg-background-color-1 px-1 py-0.5 text-center text-xs text-font-color outline-none focus:border-font-color-highlight dark:border-dark-background-color-3 dark:bg-dark-background-color-1 dark:text-dark-font-color dark:focus:border-dark-font-color-highlight"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={preAmpInputValue}
                  onFocus={() => setIsPreAmpFocused(true)}
                  onChange={(e) => {
                    const text = e.currentTarget.value;
                    setPreAmpInputValue(text);
                    const val = e.currentTarget.valueAsNumber;
                    if (!Number.isNaN(val)) {
                      dispatch({ type: 'preAmpValue', data: Math.min(12, Math.max(-12, val)) });
                    }
                  }}
                  onBlur={(e) => {
                    setIsPreAmpFocused(false);
                    const val = e.currentTarget.valueAsNumber;
                    const committed = Number.isNaN(val)
                      ? 0
                      : Math.min(12, Math.max(-12, Math.round(val * 10) / 10));
                    setPreAmpInputValue(committed.toFixed(1));
                    dispatch({ type: 'preAmpValue', data: committed });
                  }}
                />
              </div>
            </div>
          </div>
          {equalizerBands}
        </div>
      </div>
    </li>
  );
};

export default EqualizerSettings;

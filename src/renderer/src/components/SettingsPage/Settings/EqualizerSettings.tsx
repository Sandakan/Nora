import { ReactNode, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import Dropdown from '../../Dropdown';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import hasDataChanged from '../../../utils/hasDataChanged';
import { equalizerBandHertzData, equalizerPresetsData } from '../../../other/equalizerData';
import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from '../../../utils/localStorage';
import i18n from '../../../i18n';

import EqualierBand from './EqualierBand';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

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

      const isTheSamePresets = !hasDataChanged(preset, equalizer, true);
      if (isTheSamePresets) return value;
    }
  }
  return 'custom';
};

const EqualizerSettings = () => {
  const equalizerOptions = useStore(store, (state) => state.localStorage.equalizerPreset);

  const { updateEqualizerOptions } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [content, dispatch] = useReducer(
    reducer,
    equalizerOptions || LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset
  );

  const [selectedPreset, setSelectedPreset] = useState<string>('flat');

  const isTheDefaultPreset = useMemo(() => selectedPreset === 'flat', [selectedPreset]);

  useEffect(() => {
    updateEqualizerOptions(content);
    setSelectedPreset(getPresetName(content));
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
    <li className="main-container equalizer-settings-container mb-12">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
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
          <span className="zero-line absolute mb-8 ml-12 !h-[.125rem] !w-[85%] bg-background-color-2 opacity-75 dark:bg-dark-background-color-2" />
          <div className="section flex !h-full flex-col px-2 py-4 text-xs opacity-80">
            <span className="mb-20">+12dB</span>
            <span className="">0dB</span>
            <span className="mb-8 mt-20">-12dB</span>
          </div>
          {equalizerBands}
        </div>
      </div>
    </li>
  );
};

export default EqualizerSettings;

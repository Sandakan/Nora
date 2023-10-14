import React from 'react';
import Button from 'renderer/components/Button';
import Dropdown from 'renderer/components/Dropdown';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import hasDataChanged from 'renderer/utils/hasDataChanged';
import {
  equalizerBandHertzData,
  equalizerPresetsData,
} from 'renderer/other/equalizerData';
import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from 'renderer/utils/localStorage';
import EqualierBand from './EqualierBand';

const equalizerPresets: EqualizerPresetDropdownOptions[] = [
  {
    label: 'Custom',
    value: 'Custom',
    isDisabled: true,
  },
];

const presets: EqualizerPresetDropdownOptions[] = equalizerPresetsData.map(
  (presetData) => {
    return {
      label: presetData.title,
      value: presetData.title,
      preset: presetData.preset,
    };
  },
);
equalizerPresets.push(...presets);

type Action =
  | { type?: undefined; data: Equalizer }
  | { type: keyof Equalizer; data: number };

function reducer(state: Equalizer, action: Action): Equalizer {
  if (action.type === undefined) return action.data;
  if (action.type in state && typeof action.data === 'number') {
    return {
      ...state,
      [action.type]: action.data,
    };
  }
  return state;
}

const getPresetName = (equalizer: Equalizer): string => {
  for (const presetData of equalizerPresets) {
    if (presetData.preset) {
      const { preset, value } = presetData;

      if (hasDataChanged(preset, equalizer, true)) return value;
      return presetData.value;
    }
  }
  return 'custom';
};

const EqualizerSettings = () => {
  const { equalizerOptions } = React.useContext(AppContext);
  const { updateEqualizerOptions } = React.useContext(AppUpdateContext);
  const [content, dispatch] = React.useReducer(
    reducer,
    equalizerOptions || LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset,
  );

  const [selectedPreset, setSelectedPreset] = React.useState<string>('flat');

  const isTheDefaultPreset = React.useMemo(
    () => selectedPreset === 'flat',
    [selectedPreset],
  );

  React.useEffect(() => {
    updateEqualizerOptions(content);
    setSelectedPreset(getPresetName(content));
  }, [content, updateEqualizerOptions]);

  const equalizerBands = React.useMemo(() => {
    const bands = [];

    for (const [filterName, filterValue] of Object.entries(content)) {
      const equalizerFilterName = filterName as keyof Equalizer;
      const filterHertzValue = (
        equalizerBandHertzData as Record<string, number>
      )[equalizerFilterName];

      const band = (
        <EqualierBand
          value={filterValue}
          hertzValue={filterHertzValue}
          onChange={(val) => {
            dispatch({ type: equalizerFilterName, data: val });
          }}
        />
      );
      bands.push(band);
    }
    return bands;
  }, [content]);

  return (
    <li className="main-container equalizer-settings-container mb-12">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">graphic_eq</span>
        Equalizer
      </div>
      <div className="pl-6">
        <div className="flex items-center justify-between">
          <Dropdown
            name="EqualizerPresetsDropdown"
            options={equalizerPresets}
            value={selectedPreset}
            onChange={(e) => {
              const presetValue = e.currentTarget
                .value as EqualierPresetDropdownOptionValues;

              for (const preset of equalizerPresets) {
                if (preset.value === presetValue && preset.preset) {
                  dispatch({ data: preset.preset });
                }
              }
            }}
          />
          <Button
            label="Reset"
            iconName="restart_alt"
            isDisabled={isTheDefaultPreset}
            clickHandler={() => {
              const defaultPreset = equalizerPresets[1].preset;
              if (defaultPreset) {
                dispatch({ data: defaultPreset });
              }
            }}
          />
        </div>

        <div
          id="equalizer"
          className="equalizer relative mt-4 flex items-center justify-around max-w-6xl mx-auto px-8"
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

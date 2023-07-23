import React from 'react';
import Button from 'renderer/components/Button';
import Dropdown, { DropdownOption } from 'renderer/components/Dropdown';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

type EqualierPresetDropdownOptionValues =
  | 'custom'
  | 'flat'
  | 'acoustic'
  | 'bassBooster'
  | 'bassReducer'
  | 'classical'
  | 'dance'
  | 'deep'
  | 'electronic'
  | 'hipHop'
  | 'jazz'
  | 'latin'
  | 'loudness'
  | 'lounge'
  | 'piano'
  | 'pop'
  | 'RnB'
  | 'rock'
  | 'smallSpeakers'
  | 'spokenWord'
  | 'trebleBooster'
  | 'trebleReducer'
  | 'vocalBooster';

interface EqualizerPresetDropdownOptions
  extends DropdownOption<EqualierPresetDropdownOptionValues> {
  preset?: Equalizer;
}

const equalizerPresets: EqualizerPresetDropdownOptions[] = [
  {
    label: 'Custom',
    value: 'custom',
    isDisabled: true,
  },
  {
    label: 'Flat',
    value: 'flat',
    preset: {
      sixtyHertz: 0,
      hundredFiftyHertz: 0,
      fourHundredHertz: 0,
      oneKiloHertz: 0,
      twoPointFourKiloHertz: 0,
      fifteenKiloHertz: 0,
    },
  },
  {
    label: 'Acoustic',
    value: 'acoustic',
    preset: {
      sixtyHertz: 6,
      hundredFiftyHertz: 4.5,
      fourHundredHertz: 2.5,
      oneKiloHertz: 2,
      twoPointFourKiloHertz: 3.5,
      fifteenKiloHertz: 2.5,
    },
  },
  {
    label: 'Bass Booster',
    value: 'bassBooster',
    preset: {
      sixtyHertz: 5,
      hundredFiftyHertz: 3.5,
      fourHundredHertz: 1.5,
      oneKiloHertz: 0,
      twoPointFourKiloHertz: 0,
      fifteenKiloHertz: 0,
    },
  },
  {
    label: 'Bass Reducer',
    value: 'bassReducer',
    preset: {
      sixtyHertz: -4,
      hundredFiftyHertz: -3.25,
      fourHundredHertz: -1,
      oneKiloHertz: 0,
      twoPointFourKiloHertz: 0,
      fifteenKiloHertz: 0,
    },
  },
  {
    label: 'Classical',
    value: 'classical',
    preset: {
      sixtyHertz: 4.5,
      hundredFiftyHertz: 3.25,
      fourHundredHertz: -1.25,
      oneKiloHertz: -1.25,
      twoPointFourKiloHertz: 0.1,
      fifteenKiloHertz: 4,
    },
  },
  {
    label: 'Dance',
    value: 'dance',
    preset: {
      sixtyHertz: 7.5,
      hundredFiftyHertz: 5.5,
      fourHundredHertz: 2.5,
      oneKiloHertz: 4,
      twoPointFourKiloHertz: 5.25,
      fifteenKiloHertz: 0,
    },
  },
  {
    label: 'Deep',
    value: 'deep',
    preset: {
      sixtyHertz: 4,
      hundredFiftyHertz: 2,
      fourHundredHertz: 3,
      oneKiloHertz: 2.75,
      twoPointFourKiloHertz: 2,
      fifteenKiloHertz: -2,
    },
  },
  {
    label: 'Electronic',
    value: 'electronic',
    preset: {
      sixtyHertz: 5.5,
      hundredFiftyHertz: 1.5,
      fourHundredHertz: -2,
      oneKiloHertz: 2.75,
      twoPointFourKiloHertz: 1,
      fifteenKiloHertz: 5,
    },
  },
  {
    label: 'HipHop',
    value: 'hipHop',
    preset: {
      sixtyHertz: 5,
      hundredFiftyHertz: 2,
      fourHundredHertz: -0.1,
      oneKiloHertz: -0.1,
      twoPointFourKiloHertz: 2,
      fifteenKiloHertz: 3,
    },
  },
  {
    label: 'Jazz',
    value: 'jazz',
    preset: {
      sixtyHertz: 3.25,
      hundredFiftyHertz: 2,
      fourHundredHertz: -1.25,
      oneKiloHertz: -1,
      twoPointFourKiloHertz: 0.5,
      fifteenKiloHertz: 3.75,
    },
  },
  {
    label: 'Latin',
    value: 'latin',
    preset: {
      sixtyHertz: 3.25,
      hundredFiftyHertz: 0.25,
      fourHundredHertz: -1.25,
      oneKiloHertz: -1.25,
      twoPointFourKiloHertz: -1.25,
      fifteenKiloHertz: 5,
    },
  },
  {
    label: 'Loudness',
    value: 'loudness',
    preset: {
      sixtyHertz: 5,
      hundredFiftyHertz: 0.25,
      fourHundredHertz: -1.5,
      oneKiloHertz: 0,
      twoPointFourKiloHertz: 0.25,
      fifteenKiloHertz: 1.5,
    },
  },
  {
    label: 'Lounge',
    value: 'lounge',
    preset: {
      sixtyHertz: -1,
      hundredFiftyHertz: -0.25,
      fourHundredHertz: 4.5,
      oneKiloHertz: 2.75,
      twoPointFourKiloHertz: 0.5,
      fifteenKiloHertz: 1.5,
    },
  },
  {
    label: 'Piano',
    value: 'piano',
    preset: {
      sixtyHertz: 2.5,
      hundredFiftyHertz: 0.5,
      fourHundredHertz: 3.5,
      oneKiloHertz: 2,
      twoPointFourKiloHertz: 3.5,
      fifteenKiloHertz: 3.5,
    },
  },
  {
    label: 'Pop',
    value: 'pop',
    preset: {
      sixtyHertz: -0.75,
      hundredFiftyHertz: 0,
      fourHundredHertz: 4.5,
      oneKiloHertz: 4,
      twoPointFourKiloHertz: 2.5,
      fifteenKiloHertz: -1.25,
    },
  },
  {
    label: 'RnB',
    value: 'RnB',
    preset: {
      sixtyHertz: 7.5,
      hundredFiftyHertz: 6.5,
      fourHundredHertz: -2,
      oneKiloHertz: -1.5,
      twoPointFourKiloHertz: 2.75,
      fifteenKiloHertz: 3.5,
    },
  },
  {
    label: 'Rock',
    value: 'rock',
    preset: {
      sixtyHertz: 4.75,
      hundredFiftyHertz: 3.25,
      fourHundredHertz: -0.25,
      oneKiloHertz: -0.75,
      twoPointFourKiloHertz: 0.5,
      fifteenKiloHertz: 4.75,
    },
  },
  {
    label: 'Small Speakers',
    value: 'smallSpeakers',
    preset: {
      sixtyHertz: 5.25,
      hundredFiftyHertz: 4,
      fourHundredHertz: 1.5,
      oneKiloHertz: 0.25,
      twoPointFourKiloHertz: -0.5,
      fifteenKiloHertz: -3.75,
    },
  },
  {
    label: 'Spoken Word',
    value: 'spokenWord',
    preset: {
      sixtyHertz: 0,
      hundredFiftyHertz: 0.25,
      fourHundredHertz: 4,
      oneKiloHertz: 5.25,
      twoPointFourKiloHertz: 5.25,
      fifteenKiloHertz: 0.25,
    },
  },
  {
    label: 'Treble Booster',
    value: 'trebleBooster',
    preset: {
      sixtyHertz: 0,
      hundredFiftyHertz: 0,
      fourHundredHertz: 0,
      oneKiloHertz: 1.75,
      twoPointFourKiloHertz: 2.75,
      fifteenKiloHertz: 5.75,
    },
  },
  {
    label: 'Treble Reducer',
    value: 'trebleReducer',
    preset: {
      sixtyHertz: 0,
      hundredFiftyHertz: 0,
      fourHundredHertz: 0,
      oneKiloHertz: -1,
      twoPointFourKiloHertz: -2.25,
      fifteenKiloHertz: -5.25,
    },
  },
  {
    label: 'Vocal Booster',
    value: 'vocalBooster',
    preset: {
      sixtyHertz: -3.75,
      hundredFiftyHertz: -3.75,
      fourHundredHertz: 4.25,
      oneKiloHertz: 3.75,
      twoPointFourKiloHertz: 3,
      fifteenKiloHertz: 1.25,
    },
  },
];

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

const getPresetName = (
  equalizer: Equalizer,
): EqualierPresetDropdownOptionValues => {
  for (const preset of equalizerPresets) {
    if (preset.preset) {
      const {
        fifteenKiloHertz,
        fourHundredHertz,
        hundredFiftyHertz,
        oneKiloHertz,
        sixtyHertz,
        twoPointFourKiloHertz,
      } = preset.preset;

      if (
        equalizer.fifteenKiloHertz === fifteenKiloHertz &&
        equalizer.fourHundredHertz === fourHundredHertz &&
        equalizer.hundredFiftyHertz === hundredFiftyHertz &&
        equalizer.oneKiloHertz === oneKiloHertz &&
        equalizer.sixtyHertz === sixtyHertz &&
        equalizer.twoPointFourKiloHertz === twoPointFourKiloHertz
      )
        return preset.value;
    }
  }
  return 'custom';
};

const EqualizerSettings = () => {
  const { equalizerOptions } = React.useContext(AppContext);
  const { updateEqualizerOptions } = React.useContext(AppUpdateContext);
  const [content, dispatch] = React.useReducer(
    reducer,
    equalizerOptions ||
      ({
        sixtyHertz: 0,
        hundredFiftyHertz: 0,
        fourHundredHertz: 0,
        oneKiloHertz: 0,
        twoPointFourKiloHertz: 0,
        fifteenKiloHertz: 0,
      } as Equalizer),
  );

  const [selectedPreset, setSelectedPreset] =
    React.useState<EqualierPresetDropdownOptionValues>('flat');

  const isTheDefaultPreset = React.useMemo(
    () => selectedPreset === 'flat',
    [selectedPreset],
  );

  React.useEffect(() => {
    updateEqualizerOptions(content);
    setSelectedPreset(getPresetName(content));
  }, [content, updateEqualizerOptions]);

  const equalizerSliderWidths: any = {};
  equalizerSliderWidths['--seek-60Hz-equalizer-bar'] = `${
    ((content.sixtyHertz + 12) / 24) * 100
  }%`;
  equalizerSliderWidths['--seek-150Hz-equalizer-bar'] = `${
    ((content.hundredFiftyHertz + 12) / 24) * 100
  }%`;
  equalizerSliderWidths['--seek-400Hz-equalizer-bar'] = `${
    ((content.fourHundredHertz + 12) / 24) * 100
  }%`;
  equalizerSliderWidths['--seek-1kHz-equalizer-bar'] = `${
    ((content.oneKiloHertz + 12) / 24) * 100
  }%`;
  equalizerSliderWidths['--seek-2-4kHz-equalizer-bar'] = `${
    ((content.twoPointFourKiloHertz + 12) / 24) * 100
  }%`;
  equalizerSliderWidths['--seek-15kHz-equalizer-bar'] = `${
    ((content.fifteenKiloHertz + 12) / 24) * 100
  }%`;
  return (
    <li className="main-container equalizer-settings-container mb-12">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">graphic_eq</span>
        Equalizer
      </div>
      <div className="pl-6p">
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
          className="equalizer relative mt-4 flex items-center justify-center"
          style={equalizerSliderWidths}
        >
          <span className="zero-line absolute mb-8 ml-12 !h-[.125rem] !w-[62%] bg-background-color-2 opacity-75 dark:bg-dark-background-color-2" />
          <div className="section flex !h-full flex-col px-2 py-4 text-xs opacity-80">
            <span className="mb-20">+12dB</span>
            <span className="">0dB</span>
            <span className="mb-8 mt-20">-12dB</span>
          </div>
          <div className="section mx-8 flex flex-col text-center">
            <div className="sliders flex">
              <div className="range-slider flex h-60 w-8 flex-col items-center justify-end pt-2">
                <input
                  type="range"
                  className="vertical thumb-visible h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-60Hz-equalizer-bar)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
                  min="-12"
                  value={content.sixtyHertz}
                  max="12"
                  step="0.1"
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    dispatch({ type: 'sixtyHertz', data: val });
                  }}
                />
                <span className="scope-min mt-24 text-sm opacity-80">60Hz</span>
              </div>
            </div>
          </div>

          <div className="section mx-8 flex flex-col text-center">
            <div className="sliders flex">
              <div className="range-slider flex h-60 w-8 flex-col items-center justify-end pt-2">
                <input
                  type="range"
                  className="vertical thumb-visible h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-150Hz-equalizer-bar)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
                  min="-12"
                  value={content.hundredFiftyHertz}
                  max="12"
                  step="0.1"
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    dispatch({ type: 'hundredFiftyHertz', data: val });
                  }}
                />
                <span className="scope-min mt-24 text-sm opacity-80">
                  150Hz
                </span>
              </div>
            </div>
          </div>

          <div className="section mx-8 flex flex-col text-center">
            <div className="sliders flex">
              <div className="range-slider flex h-60 w-8 flex-col items-center justify-end pt-2">
                <input
                  type="range"
                  className="vertical thumb-visible h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-400Hz-equalizer-bar)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
                  min="-12"
                  value={content.fourHundredHertz}
                  max="12"
                  step="0.1"
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    dispatch({ type: 'fourHundredHertz', data: val });
                  }}
                />
                <span className="scope-min mt-24 text-sm opacity-80">
                  400Hz
                </span>
              </div>
            </div>
          </div>

          <div className="section mx-8 flex flex-col text-center">
            <div className="sliders flex">
              <div className="range-slider flex h-60 w-8 flex-col items-center justify-end pt-2">
                <input
                  type="range"
                  className="vertical thumb-visible h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-1kHz-equalizer-bar)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
                  min="-12"
                  value={content.oneKiloHertz}
                  max="12"
                  step="0.1"
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    dispatch({ type: 'oneKiloHertz', data: val });
                  }}
                />
                <span className="scope-min mt-24 text-sm opacity-80">1kHz</span>
              </div>
            </div>
          </div>

          <div className="section mx-8 flex flex-col text-center">
            <div className="sliders flex">
              <div className="range-slider flex h-60 w-8 flex-col items-center justify-end pt-2">
                <input
                  type="range"
                  className="vertical thumb-visible h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-2-4kHz-equalizer-bar)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
                  min="-12"
                  value={content.twoPointFourKiloHertz}
                  max="12"
                  step="0.1"
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    dispatch({ type: 'twoPointFourKiloHertz', data: val });
                  }}
                />
                <span className="scope-min mt-24 text-sm opacity-80">
                  2.4kHz
                </span>
              </div>
            </div>
          </div>

          <div className="section mx-8 flex flex-col text-center">
            <div className="sliders flex">
              <div className="range-slider flex h-60 w-8 flex-col items-center justify-end pt-2">
                <input
                  type="range"
                  className="vertical thumb-visible h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-15kHz-equalizer-bar)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
                  min="-12"
                  value={content.fifteenKiloHertz}
                  max="12"
                  step="0.1"
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    dispatch({ type: 'fifteenKiloHertz', data: val });
                  }}
                />
                <span className="scope-min mt-24 text-sm opacity-80">
                  15kHz
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default EqualizerSettings;

import { useEffect, useState, type CSSProperties } from 'react';

type Props = {
  value: number;
  hertzValue: number;
  onChange: (value: number) => void;
};

const EqualierBand = (props: Props) => {
  const { onChange, value, hertzValue } = props;

  // Keep the raw string while the input is focused so typing decimals like
  // 1.25 isn't snapped to 1.3 mid-entry. The committed value is rounded to
  // one decimal place on blur.
  const [inputValue, setInputValue] = useState(value.toFixed(1));
  const [isFocused, setIsFocused] = useState(false);

  // Re-sync from the prop when the value changes from outside (preset load,
  // slider drag) while the number input is not being edited.
  useEffect(() => {
    if (!isFocused) setInputValue(value.toFixed(1));
  }, [value, isFocused]);

  const bandWidthStyle: CSSProperties = {};
  bandWidthStyle[`--equalizer-band`] = `${((value + 12) / 24) * 100}%`;

  return (
    <div className="section mx-6 flex flex-col text-center xl:mx-2" style={bandWidthStyle}>
      <div className="sliders flex">
        <div className="range-slider flex h-60 w-full max-w-[1.75rem] flex-col items-center justify-end pt-2">
          <input
            type="range"
            className="vertical thumb-visible before:bg-font-color-highlight hover:before:bg-font-color-highlight dark:before:bg-dark-font-color-highlight dark:hover:before:bg-dark-font-color-highlight h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-hidden outline-offset-1 before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--equalizer-band)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:transition-[width,background] before:content-[''] focus-visible:outline!"
            min="-12"
            value={value}
            max="12"
            step="0.1"
            onChange={(e) => {
              const val = e.currentTarget.valueAsNumber;
              onChange(val);
            }}
          />
          <span className="scope-min mt-24 text-sm opacity-80">
            {hertzValue > 1000 ? `${hertzValue / 1000}KHz` : `${hertzValue}Hz`}
          </span>
          <input
            type="number"
            className="equalizer-band-input mt-1 w-full rounded border border-background-color-3 bg-background-color-1 px-1 py-0.5 text-center text-xs text-font-color outline-none focus:border-font-color-highlight dark:border-dark-background-color-3 dark:bg-dark-background-color-1 dark:text-dark-font-color dark:focus:border-dark-font-color-highlight"
            min="-12"
            max="12"
            step="0.1"
            value={inputValue}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => {
              const text = e.currentTarget.value;
              setInputValue(text);
              const val = e.currentTarget.valueAsNumber;
              if (!Number.isNaN(val)) {
                onChange(Math.min(12, Math.max(-12, val)));
              }
            }}
            onBlur={(e) => {
              setIsFocused(false);
              const val = e.currentTarget.valueAsNumber;
              const committed = Number.isNaN(val) ? 0 : Math.min(12, Math.max(-12, Math.round(val * 10) / 10));
              setInputValue(committed.toFixed(1));
              onChange(committed);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EqualierBand;

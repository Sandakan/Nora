import type { CSSProperties } from 'react';

type Props = {
  value: number;
  hertzValue: number;
  onChange: (value: number) => void;
};

const EqualierBand = (props: Props) => {
  const { onChange, value, hertzValue } = props;

  const bandWidthStyle: CSSProperties = {};
  bandWidthStyle[`--equalizer-band`] = `${((value + 12) / 24) * 100}%`;

  return (
    <div className="section mx-6 flex flex-col text-center xl:mx-2" style={bandWidthStyle}>
      <div className="sliders flex">
        <div className="range-slider flex h-60 w-full max-w-[1.75rem] flex-col items-center justify-end pt-2">
          <input
            type="range"
            className="vertical thumb-visible h-10 w-48 -rotate-90 cursor-row-resize appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--equalizer-band)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-highlight before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-dark-font-color-highlight dark:hover:before:bg-dark-font-color-highlight"
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
        </div>
      </div>
    </div>
  );
};

export default EqualierBand;

/* eslint-disable react/require-default-props */
import React from 'react';

export interface DropdownOption<T extends string> {
  label: string;
  value: T;
  isDisabled?: boolean;
}

export interface DropdownProp<T extends string> {
  name: string;
  className?: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (_e: React.ChangeEvent<HTMLSelectElement>) => void;
  isDisabled?: boolean;
}

function Dropdown<T extends string>(props: DropdownProp<T>) {
  const { className, name, value, onChange, options, isDisabled = false } = props;

  const optionComponents = React.useMemo(
    () =>
      options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.isDisabled}
          className="!bg-context-menu-background/90 !text-font-color-black dark:!bg-dark-context-menu-background/90 dark:!text-font-color-white"
        >
          {option.label}
        </option>
      )),
    [options]
  );

  return (
    <select
      name={name}
      id={name}
      className={`dropdown h-10 w-60 cursor-pointer appearance-none rounded-lg border-[3px] border-background-color-2 bg-background-color-1/40 px-3 text-sm text-font-color-black outline-none backdrop-blur-sm transition-[border-color] ease-in-out hover:border-background-color-3 focus:!border-background-color-3 focus-visible:!border-font-color-highlight-2 active:border-background-color-3 dark:border-dark-background-color-2 dark:bg-dark-background-color-1/40 dark:text-font-color-white dark:hover:border-dark-background-color-3 dark:focus:!border-dark-background-color-3 dark:focus-visible:!border-dark-font-color-highlight-2 dark:active:border-dark-background-color-3 ${
        isDisabled &&
        `!cursor-not-allowed !border-font-color-dimmed/10 !text-opacity-50 !opacity-50 !brightness-90 !backdrop-blur-none !transition-none dark:!border-font-color-dimmed/40`
      } ${className}`}
      value={value}
      onChange={onChange}
      disabled={isDisabled}
    >
      {optionComponents}
    </select>
  );
}

export default Dropdown;

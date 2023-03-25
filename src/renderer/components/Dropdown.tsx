/* eslint-disable react/require-default-props */
import React from 'react';

export interface DropdownOption<T extends string> {
  label: string;
  value: T;
}

interface DropdownProp<T extends string> {
  name: string;
  className?: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (_e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function Dropdown<T extends string>(props: DropdownProp<T>) {
  const { className, name, value, onChange, options } = props;

  const optionComponents = React.useMemo(
    () =>
      options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="!bg-context-menu-background !text-font-color-black dark:!bg-dark-context-menu-background dark:!text-font-color-white"
        >
          {option.label}
        </option>
      )),
    [options]
  );

  return (
    <select
      name={name}
      className={`dropdown h-10 w-60 cursor-pointer appearance-none rounded-lg border-[3px] border-background-color-2 bg-[transparent] px-3 text-sm text-font-color-black outline-none backdrop-blur-sm transition-[border-color] ease-in-out hover:border-background-color-3 focus:!border-background-color-3 focus-visible:!border-font-color-highlight-2 active:border-background-color-3 dark:border-dark-background-color-2 dark:text-font-color-white dark:hover:border-dark-background-color-3 dark:focus:!border-dark-background-color-3 dark:focus-visible:!border-dark-font-color-highlight-2 dark:active:border-dark-background-color-3 ${className}`}
      value={value}
      onChange={onChange}
    >
      {optionComponents}
    </select>
  );
}

export default Dropdown;

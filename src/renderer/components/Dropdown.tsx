/* eslint-disable react/require-default-props */
import React from 'react';

interface DropdownProp {
  name: string;
  className?: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function Dropdown(props: DropdownProp) {
  const { className, name, value, onChange, options } = props;

  const optionComponents = React.useMemo(
    () =>
      options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )),
    [options]
  );

  return (
    <select
      name={name}
      className={`dropdown appearance-none bg-context-menu-background dark:bg-dark-context-menu-background backdrop-blur-sm text-sm text-font-color-black dark:text-font-color-white w-60 h-10 border-[3px] border-background-color-2 dark:border-dark-background-color-2 rounded-lg px-3 outline-none cursor-pointer transition-[border-color] ease-in-out hover:border-background-color-3 dark:hover:border-dark-background-color-3 ${className}`}
      value={value}
      onChange={onChange}
    >
      {optionComponents}
    </select>
  );
}

export default Dropdown;

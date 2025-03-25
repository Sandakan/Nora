import { type ChangeEvent, useMemo } from 'react';

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
  onChange: (_e: ChangeEvent<HTMLSelectElement>) => void;
  isDisabled?: boolean;
  type?: string;
}

function Dropdown<T extends string>(props: DropdownProp<T>) {
  const { className, name, value, onChange, options, isDisabled = false, type = '' } = props;

  const optionComponents = useMemo(
    () =>
      options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.isDisabled}
          className="bg-context-menu-background/90! text-font-color-black! dark:bg-dark-context-menu-background/90! dark:text-font-color-white!"
        >
          {type} {option.label}
        </option>
      )),
    [options, type]
  );

  return (
    <select
      name={name}
      id={name}
      className={`dropdown ml-4 h-10 w-52 cursor-pointer appearance-none truncate rounded-lg border-[3px] border-background-color-2 bg-background-color-2/25 px-3 text-sm text-font-color-black outline-hidden backdrop-blur-xs transition-[border-color] ease-in-out hover:border-background-color-3 hover:bg-background-color-2/50 focus:!border-background-color-3 focus-visible:!border-font-color-highlight-2 focus-visible:bg-background-color-2/50 active:border-background-color-3 dark:border-dark-background-color-2 dark:bg-dark-background-color-2/25 dark:text-font-color-white dark:hover:border-dark-background-color-3 dark:hover:bg-dark-background-color-2/50 dark:focus:!border-dark-background-color-3 dark:focus-visible:!border-dark-font-color-highlight-2 dark:focus-visible:bg-dark-background-color-2/50 dark:active:border-dark-background-color-3 ${
        isDisabled &&
        `cursor-not-allowed! border-font-color-dimmed/10! text-opacity-50! opacity-50! brightness-90! backdrop-blur-none! transition-none! dark:border-font-color-dimmed/40!`
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

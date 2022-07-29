/* eslint-disable react/require-default-props */
import React from 'react';

export interface ButtonProps {
  label?: string;
  iconName?: string;
  className?: string;
  iconClassName?: string;
  clickHandler: (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.KeyboardEvent<HTMLButtonElement>
  ) => void;
}

const Button = React.memo((props: ButtonProps) => {
  const { className, iconName, iconClassName, label, clickHandler } = props;
  return (
    <button
      type="button"
      className={`button flex items-center justify-center rounded-3xl mr-4 cursor-pointer bg-[transparent] dark:bg-[transparent] text-font-color-black dark:text-font-color-white px-4 py-2 border-[3px] transition-[border] border-background-color-2 dark:border-dark-background-color-2 hover:border-background-color-3 dark:hover:border-dark-background-color-3 ease-in-out ${className}`}
      onClick={(e) => clickHandler(e)}
      onKeyDown={(e) => clickHandler(e)}
    >
      {iconName && (
        <span
          className={`material-icons-round icon mr-3 text-lg ${iconClassName}`}
        >
          {iconName}
        </span>
      )}
      {label && <span className="button-label-text w-max">{label}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;

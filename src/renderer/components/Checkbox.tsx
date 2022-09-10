/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/label-has-associated-control */

import React from 'react';

interface CheckboxProp {
  id: string;
  className?: string;
  isChecked: boolean;
  checkedStateUpdateFunction: (state: boolean) => void;
  labelContent?: string;
}

const Checkbox = React.memo((props: CheckboxProp) => {
  const { id, checkedStateUpdateFunction, isChecked, labelContent, className } =
    props;
  return (
    <div
      className={`checkbox-and-labels-container flex items-center mt-4 ml-2 ${className}`}
    >
      <input
        type="checkbox"
        name={id}
        id={id}
        className="hidden peer"
        checked={isChecked}
        onChange={(e) => checkedStateUpdateFunction(e.currentTarget.checked)}
      />
      <label
        className="checkmark w-5 h-5 cursor-pointer bg-[transparent] border-2 border-font-color-highlight dark:border-dark-font-color-highlight flex items-center justify-center rounded-md peer-checked:bg-font-color-highlight dark:peer-checked:bg-dark-font-color-highlight"
        htmlFor={id}
      >
        <span className="material-icons-round icon text-lg opacity-0 text-font-color-white dark:text-font-color-black">
          check
        </span>
      </label>
      {labelContent && (
        <label htmlFor={id} className="info ml-4 cursor-pointer">
          {labelContent}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
export default Checkbox;

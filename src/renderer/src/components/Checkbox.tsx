/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import { type KeyboardEvent, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface CheckboxProp {
  id: string;
  className?: string;
  isChecked: boolean;
  checkedStateUpdateFunction: (_state: boolean) => void;
  labelContent?: string;
  isDisabled?: boolean;
  tooltipLabel?: string;
}

const Checkbox = memo((props: CheckboxProp) => {
  const { t } = useTranslation();

  const {
    id,
    checkedStateUpdateFunction,
    isChecked,
    labelContent,
    className,
    isDisabled = false,
    tooltipLabel
  } = props;

  const focusInput = useCallback((e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      const inputId = e.currentTarget.htmlFor;
      const inputElement = document.getElementById(inputId);
      inputElement?.click();
    }
  }, []);

  return (
    <label
      htmlFor={id}
      className={`checkbox-and-labels-container mt-4 ml-2 flex w-fit! items-center outline-offset-1 transition-opacity focus-visible:outline! ${
        isDisabled && 'cursor-not-allowed! opacity-50'
      } ${className}`}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={focusInput}
      title={(tooltipLabel ?? isDisabled) ? t('common.optionDisabled') : undefined}
    >
      <input
        type="checkbox"
        name={id}
        id={id}
        className="peer hidden"
        checked={isChecked}
        disabled={isDisabled}
        onChange={(e) => checkedStateUpdateFunction(e.currentTarget.checked)}
      />
      <label
        className={`checkmark border-font-color-highlight peer-checked:bg-font-color-highlight dark:border-dark-font-color-highlight dark:peer-checked:bg-dark-font-color-highlight flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 bg-transparent shadow-lg ${
          isDisabled && 'cursor-not-allowed!'
        }`}
        htmlFor={id}
      >
        <span className="material-icons-round icon text-font-color-white dark:text-font-color-black text-xl opacity-0">
          check
        </span>
      </label>
      {labelContent && (
        <label
          htmlFor={id}
          className={`info ml-4 cursor-pointer ${isDisabled && 'cursor-not-allowed!'}`}
        >
          {labelContent}
        </label>
      )}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';
export default Checkbox;

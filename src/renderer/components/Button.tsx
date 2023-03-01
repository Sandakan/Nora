/* eslint-disable no-unused-vars */
import React from 'react';

export interface ButtonProps {
  label?: string;
  iconName?: string;
  className?: string;
  iconClassName?: string;
  pendingClassName?: string;
  clickHandler: (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.KeyboardEvent<HTMLButtonElement>,
    setIsDisabled: (state: boolean) => void,
    setIsPending: (state: boolean) => void
  ) => void;
  isDisabled?: boolean;
  tooltipLabel?: string;
  pendingAnimationOnDisabled?: boolean;
  style?: React.CSSProperties;
  onContextMenu?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const Button = React.memo((props: ButtonProps) => {
  const {
    className,
    iconName,
    iconClassName,
    pendingClassName,
    label,
    clickHandler,
    tooltipLabel,
    pendingAnimationOnDisabled = false,
    onContextMenu,
    isDisabled = false,
    style,
  } = props;

  const [isButtonDisabled, setIsButtonDisabled] = React.useState(isDisabled);
  const [isStatusPending, setIsStatusPending] = React.useState(
    pendingAnimationOnDisabled
  );

  React.useEffect(() => {
    setIsButtonDisabled(isDisabled);
  }, [isDisabled]);

  const updateIsDisabled = (state: boolean) => setIsButtonDisabled(state);
  const updateIsPending = (state: boolean) => setIsStatusPending(state);

  const buttonIcons = React.useMemo(() => {
    if (iconName) {
      const iconNames = iconName?.split(';');
      return iconNames.map((name, index) => {
        return (
          <span
            className={`material-icons-round icon relative flex items-center justify-center text-lg ${
              label && iconNames.length - 1 === index && 'mr-3'
            } ${iconClassName} ${
              isStatusPending && isButtonDisabled && `h-4 w-4 `
            }`}
          >
            {isStatusPending && isButtonDisabled ? '' : name}
          </span>
        );
      });
    }
    return [];
  }, [iconClassName, iconName, isButtonDisabled, isStatusPending, label]);

  return (
    <button
      type="button"
      className={`button group mr-4 flex cursor-pointer items-center justify-center rounded-3xl border-[3px] border-background-color-2 bg-[transparent] px-4 py-2 text-sm text-font-color-black transition-[border] ease-in-out hover:border-background-color-3 dark:border-dark-background-color-2 dark:bg-[transparent] dark:text-font-color-white dark:hover:border-dark-background-color-3 ${
        isButtonDisabled &&
        `!cursor-not-allowed  !border-font-color-dimmed/10 !text-opacity-50 !brightness-50 !transition-none dark:!border-font-color-dimmed/40`
      } ${className}`}
      onClick={(e) =>
        !isButtonDisabled && clickHandler(e, updateIsDisabled, updateIsPending)
      }
      tabIndex={0}
      title={tooltipLabel || label}
      disabled={isButtonDisabled}
      onContextMenu={onContextMenu}
      style={style}
    >
      {isStatusPending && isButtonDisabled ? (
        <span
          className={`material-icons-round icon relative mr-2 flex h-4 w-4 items-center justify-center text-lg after:absolute after:mx-auto after:block after:h-4 after:w-4 after:animate-spin-ease after:items-center after:justify-center after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-black after:content-[''] dark:after:border-t-font-color-white
         ${pendingClassName}`}
        >
          {isStatusPending ? '' : iconName}
        </span>
      ) : (
        buttonIcons
      )}
      {label && <span className="button-label-text w-max">{label}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;

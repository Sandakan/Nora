import React from 'react';

export interface ButtonProps {
  id?: string;
  label?: string;
  iconName?: string;
  className?: string;
  iconClassName?: string;
  pendingClassName?: string;
  clickHandler: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent<HTMLButtonElement>,
    setIsDisabled: (state: boolean) => void,
    setIsPending: (state: boolean) => void
  ) => void;
  isDisabled?: boolean;
  isVisible?: boolean;
  tooltipLabel?: string;
  pendingAnimationOnDisabled?: boolean;
  style?: React.CSSProperties;
  onContextMenu?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  removeFocusOnClick?: boolean;
  children?: string;
}

const Button = React.memo((props: ButtonProps) => {
  const {
    id,
    className,
    iconName,
    iconClassName,
    pendingClassName,
    children,
    label = children,
    clickHandler,
    tooltipLabel = label,
    pendingAnimationOnDisabled = false,
    onContextMenu,
    isDisabled = false,
    isVisible = true,
    style,
    removeFocusOnClick = true
  } = props;

  const [isButtonDisabled, setIsButtonDisabled] = React.useState(isDisabled);
  const [isStatusPending, setIsStatusPending] = React.useState(pendingAnimationOnDisabled);

  React.useEffect(() => {
    setIsButtonDisabled(isDisabled);
  }, [isDisabled]);

  const updateIsDisabled = (state: boolean) => setIsButtonDisabled(state);
  const updateIsPending = (state: boolean) => setIsStatusPending(state);

  const buttonIcons = React.useMemo(() => {
    if (iconName) {
      const iconNames = iconName.split(';');
      return iconNames.map((name, index) => {
        return (
          <span
            key={name}
            className={`material-icons-round icon relative flex items-center justify-center text-lg !leading-none ${
              label && iconNames.length - 1 === index && 'mr-3'
            } ${iconClassName} ${isStatusPending && isButtonDisabled && `h-4 w-4 `}`}
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
      id={id}
      className={`button group mr-4 flex cursor-pointer items-center justify-center rounded-3xl border-[3px] border-background-color-2 bg-[transparent] px-4 py-2 text-sm text-font-color-black transition-[border,background,color] ease-in-out hover:border-background-color-3 focus-visible:!border-font-color-highlight-2 dark:border-dark-background-color-2 dark:bg-[transparent] dark:text-font-color-white dark:hover:border-dark-background-color-3 dark:focus-visible:!border-dark-font-color-highlight-2 ${
        isButtonDisabled &&
        `!cursor-not-allowed  !border-font-color-dimmed/10 !text-opacity-50 !brightness-50 !transition-none dark:!border-font-color-dimmed/40`
      } ${!isVisible && 'hidden'} ${className}`}
      onClick={(e) => {
        if (!isButtonDisabled) {
          if (removeFocusOnClick) e.currentTarget.blur();
          clickHandler(e, updateIsDisabled, updateIsPending);
        }
      }}
      title={tooltipLabel || label}
      disabled={isButtonDisabled}
      onContextMenu={onContextMenu}
      style={style}
    >
      {isStatusPending && isButtonDisabled ? (
        <span
          className={`material-icons-round icon relative flex h-4 w-4 items-center justify-center text-lg after:absolute after:mx-auto after:block after:h-4 after:w-4 after:animate-spin-ease after:items-center after:justify-center after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-black after:content-[''] dark:after:border-t-font-color-white
         ${(!isStatusPending || label) && 'mr-2'} ${pendingClassName}`}
        >
          {isStatusPending ? '' : iconName}
        </span>
      ) : (
        buttonIcons
      )}
      {label && <span className="button-label-text w-max leading-none">{label}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;

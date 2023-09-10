/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactNode } from 'react';
import Button, { ButtonProps } from './Button';
import Dropdown, { DropdownProp } from './Dropdown';

interface ExtendedButtonProps extends ButtonProps {
  isVisible?: boolean;
}

type Props = {
  title: string;
  className?: string;
  titleClassName?: string;
  isButtonsAndDropdownsVisible?: boolean;
  buttons?: ExtendedButtonProps[];
  dropdown?: DropdownProp<string>;
  otherItems?: ReactNode[];
};

const TitleContainer = (props: Props) => {
  const {
    title,
    className,
    titleClassName,
    dropdown,
    buttons = [],
    otherItems = [],
    isButtonsAndDropdownsVisible = true,
  } = props;

  const dropdownComponent = React.useMemo(() => {
    if (dropdown) return <Dropdown {...dropdown} />;
    return undefined;
  }, [dropdown]);

  const buttonComponents = React.useMemo(() => {
    if (buttons.length > 0) {
      const filteredButtons = buttons.filter((button) => {
        const { isVisible = true } = button;
        return isVisible;
      });

      return filteredButtons.map((button) => (
        <Button
          {...button}
          key={button.id || button.label || button.iconName}
        />
      ));
    }

    return undefined;
  }, [buttons]);

  return (
    <div
      className={`title-container mb-4 mt-1 flex items-center justify-between text-font-color-black dark:text-font-color-white  ${className}`}
    >
      <div className="grid grid-flow-col items-center gap-5">
        <p
          className={`text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight ${titleClassName}`}
        >
          {title}
        </p>
        {otherItems}
      </div>
      {isButtonsAndDropdownsVisible && (
        <div className="other-controls-container flex">
          {buttonComponents} {dropdownComponent}
        </div>
      )}
    </div>
  );
};

export default TitleContainer;

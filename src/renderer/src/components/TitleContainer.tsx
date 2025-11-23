import { type ReactNode, useMemo } from 'react';
import Button, { type ButtonProps } from './Button';
import Dropdown, { type DropdownProp } from './Dropdown';
// import useResizeObserver from '../hooks/useResizeObserver';

interface ExtendedButtonProps extends ButtonProps {
  isVisible?: boolean;
}

type Props = {
  title: string;
  className?: string;
  titleClassName?: string;
  isButtonsAndDropdownsVisible?: boolean;
  buttons?: ExtendedButtonProps[];
  dropdowns?: DropdownProp<string>[];
  otherItems?: ReactNode[];
};

const TitleContainer = (props: Props) => {
  const {
    title,
    className,
    titleClassName,
    dropdowns = [],
    buttons = [],
    otherItems = [],
    isButtonsAndDropdownsVisible = true
  } = props;

  // const containerRef = useRef<HTMLDivElement>(null);
  // const buttonsContainerRef = useRef<HTMLDivElement>(null);

  // const { width } = useResizeObserver(containerRef);

  // useEffect(() => {
  //   if (containerRef.current && buttonsContainerRef.current) {
  //     const containerWidth = containerRef.current.offsetWidth;
  //     const screenWidth = window.innerWidth;
  //     let totalWidth = 0;

  //     const elements = buttonsContainerRef.current.getElementsByTagName('button');

  //     const set = new Map<string, number>();
  //     for (const element of elements) {
  //       totalWidth += element.offsetWidth;
  //       set.set(element.title, element.offsetWidth);
  //       // if (totalWidth > containerWidth && totalWidth > screenWidth) {
  //       //   set.add(element.title);
  //       // } else {
  //       //   set.delete(element.title);
  //       // }
  //     }

  //     console.log({ containerWidth, screenWidth, totalWidth, set });
  //   }
  // }, [width]);

  const dropdownComponent = useMemo(() => {
    if (dropdowns.length > 0)
      return dropdowns.map((dropdown) => <Dropdown key={dropdown.name} {...dropdown} />);
    return undefined;
  }, [dropdowns]);

  const buttonComponents = useMemo(() => {
    if (buttons.length > 0) {
      const filteredButtons = buttons.filter((button) => {
        const { isVisible = true } = button;
        return isVisible;
      });

      return filteredButtons.map((button) => (
        <Button {...button} key={button.id || button.label || button.iconName} />
      ));
    }

    return undefined;
  }, [buttons]);

  return (
    <div
      className={`title-container text-font-color-black dark:text-font-color-white mt-1 mb-4 flex items-center justify-between ${className}`}
      // ref={containerRef}
    >
      <div className="grid grid-flow-col items-center gap-5">
        <p
          className={`text-font-color-highlight dark:text-dark-font-color-highlight text-3xl font-medium ${titleClassName}`}
        >
          {title}
        </p>
        {otherItems}
      </div>
      {isButtonsAndDropdownsVisible && (
        <div className="other-controls-container flex">
          <div
            className="buttons-container flex"
            // ref={buttonsContainerRef}
          >
            {buttonComponents}
          </div>
          <div className="dropdowns-container flex">{dropdownComponent}</div>
        </div>
      )}
    </div>
  );
};

export default TitleContainer;

import { useMemo } from 'react';
import Button, { type ButtonProps } from '../Button';

interface NoLyricsProp {
  title: string;
  description: string;
  iconName: string;
  buttons?: ButtonProps[];
}

const NoLyrics = (props: NoLyricsProp) => {
  const { title, iconName, description, buttons = [] } = props;

  const buttonComponents = useMemo(() => {
    return buttons.map((button, i) => {
      return <Button key={i} {...button} />;
    });
  }, [buttons]);

  return (
    <div className="no-lyrics-container flex h-full flex-col items-center justify-center text-center text-font-color-black/75 dark:text-font-color-white/60">
      <span className="material-icons-round-outlined mb-4 text-6xl text-font-color-highlight dark:text-dark-font-color-highlight">
        {iconName}
      </span>
      <p className="mb-2 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        {title}
      </p>
      <p className="text-sm">{description}</p>
      {buttons.length > 0 && (
        <div className="buttons-container mt-4 flex items-center justify-center">
          {buttonComponents}
        </div>
      )}
    </div>
  );
};

export default NoLyrics;

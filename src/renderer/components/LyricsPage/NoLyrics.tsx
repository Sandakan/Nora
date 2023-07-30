import React from 'react';
import Button, { ButtonProps } from '../Button';
import Img from '../Img';

interface NoLyricsProp {
  content: string;
  artworkPath: string;
  buttons?: ButtonProps[];
}

const NoLyrics = (props: NoLyricsProp) => {
  const { artworkPath, content, buttons = [] } = props;

  const buttonComponents = React.useMemo(() => {
    return buttons.map((button) => {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Button {...button} />;
    });
  }, [buttons]);

  return (
    <div className="no-lyrics-container flex h-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
      <Img src={artworkPath} className="mb-8 w-52" alt="" />
      <p className="max-w-[70%]">{content}</p>
      {buttons.length > 0 && (
        <div className="buttons-container mt-4 flex items-center justify-center">
          {buttonComponents}
        </div>
      )}
    </div>
  );
};

export default NoLyrics;

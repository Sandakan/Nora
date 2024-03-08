/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState } from 'react';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

type Props = {
  isActive: boolean;
  start: number;
  end: number;
  delay: number;
  text: string;
};

const EnhancedSyncedLyricWord = (props: Props) => {
  const { updateSongPosition } = React.useContext(AppUpdateContext);
  const { isActive, start, end, delay, text } = props;
  const [isInRange, setIsInRange] = useState(false);

  const handleSongPositionChange = React.useCallback(
    (e: Event) => {
      if ('detail' in e && !Number.isNaN(e.detail)) {
        const songPosition = e.detail as number;

        setIsInRange(
          songPosition > start - delay && songPosition < end - delay,
        );
      }
    },
    [delay, end, start],
  );

  React.useEffect(() => {
    if (isActive) {
      document.addEventListener(
        'player/positionChange',
        handleSongPositionChange,
      );
    } else {
      document.removeEventListener(
        'player/positionChange',
        handleSongPositionChange,
      );
    }

    return () =>
      document.removeEventListener(
        'player/positionChange',
        handleSongPositionChange,
      );
  }, [handleSongPositionChange, isActive]);

  return (
    <span
      onClick={() => updateSongPosition(start)}
      className={`mr-2 text-font-color-black last:mr-0 dark:text-font-color-white ${
        isInRange
          ? '!text-opacity-90'
          : isActive
            ? '!text-opacity-50'
            : '!text-opacity-20 hover:!text-opacity-75'
      }`}
    >
      {text}
    </span>
  );
};

export default EnhancedSyncedLyricWord;

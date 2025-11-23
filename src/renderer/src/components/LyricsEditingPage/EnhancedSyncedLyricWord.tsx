/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

type Props = {
  isActive: boolean;
  start: number;
  end: number;
  delay: number;
  text: string;
};

const EnhancedSyncedLyricWord = (props: Props) => {
  const { updateSongPosition } = useContext(AppUpdateContext);
  const { isActive, start, end, delay, text } = props;
  const [isInRange, setIsInRange] = useState(false);

  const handleSongPositionChange = useCallback(
    (e: Event) => {
      if ('detail' in e && !Number.isNaN(e.detail)) {
        const songPosition = e.detail as number;

        setIsInRange(songPosition > start - delay && songPosition < end - delay);
      }
    },
    [delay, end, start]
  );

  useEffect(() => {
    if (isActive) {
      document.addEventListener('player/positionChange', handleSongPositionChange);
    } else {
      document.removeEventListener('player/positionChange', handleSongPositionChange);
    }

    return () => document.removeEventListener('player/positionChange', handleSongPositionChange);
  }, [handleSongPositionChange, isActive]);

  return (
    <span
      onClick={() => updateSongPosition(start)}
      className={`text-font-color-black dark:text-font-color-white mr-2 transition-colors last:mr-0 ${
        isInRange
          ? 'text-font-color-highlight/90 dark:text-font-color-highlight/90'
          : isActive
            ? 'text-font-color-black/50 dark:text-font-color-white/50'
            : 'text-font-color-black/20 dark:text-font-color-white/20 hover:text-font-color-black/75! dark:hover:text-font-color-white/75!'
      }`}
    >
      {text}
    </span>
  );
};

export default EnhancedSyncedLyricWord;

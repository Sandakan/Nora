import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import roundTo from '../../../../common/roundTo';

type Props = { offset: number };

const LyricsEditingPageDurationCounter = (props: Props) => {
  const { t } = useTranslation();
  const [roundedSongPosition, setRoundedSongPosition] = useState(0);

  const { offset = 0 } = props;

  const handleSongPositionChange = useCallback(
    (e: Event) => {
      if ('detail' in e && !Number.isNaN(e.detail)) {
        const songPosition = e.detail as number;

        setRoundedSongPosition(roundTo(songPosition + offset, 2));
      }
    },
    [offset]
  );

  useEffect(() => {
    document.addEventListener('player/positionChange', handleSongPositionChange);

    return () => document.removeEventListener('player/positionChange', handleSongPositionChange);
  }, [handleSongPositionChange]);

  return (
    <span className="">
      {t('lyricsEditingPage.playbackTime')} : {roundedSongPosition}{' '}
      {offset !== 0 && (
        <span className="text-font-color-highlight dark:text-dark-font-color-highlight font-medium uppercase">
          {offset > 0 && '+'}{' '}
          {t('lyricsEditingPage.offsetWithCount', {
            count: offset
          })}
        </span>
      )}
    </span>
  );
};

export default LyricsEditingPageDurationCounter;

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import roundTo from '../../../../common/roundTo';
import { getPlayer } from '../../hooks/useAudioPlayer';

type Props = { offset: number };

const LyricsEditingPageDurationCounter = (props: Props) => {
  const { t } = useTranslation();
  const { offset = 0 } = props;
  const [roundedSongPosition, setRoundedSongPosition] = useState(0);

  useEffect(() => {
    const player = getPlayer();
    let animationFrameId: number | null = null;

    const updatePosition = () => {
      const exactTime = player.getExactCurrentTime();
      setRoundedSongPosition(roundTo(exactTime + offset, 2));
    };

    const loop = () => {
      updatePosition();
      animationFrameId = requestAnimationFrame(loop);
    };

    const handlePlay = () => {
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    const handlePause = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      updatePosition();
    };

    const handleSeekOrTimeUpdate = () => {
      updatePosition();
    };

    // Initial position sync
    updatePosition();

    if (!player.paused) {
      animationFrameId = requestAnimationFrame(loop);
    }

    player.on('play', handlePlay);
    player.on('pause', handlePause);
    player.on('seeked', handleSeekOrTimeUpdate);
    player.on('timeUpdate', handleSeekOrTimeUpdate);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      player.off('play', handlePlay);
      player.off('pause', handlePause);
      player.off('seeked', handleSeekOrTimeUpdate);
      player.off('timeUpdate', handleSeekOrTimeUpdate);
    };
  }, [offset]);

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

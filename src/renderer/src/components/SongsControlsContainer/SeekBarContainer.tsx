import { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import calculateTime from '../../utils/calculateTime';
import SeekBarSlider from '../SeekBarSlider';

const SeekBarContainer = () => {
  const { localStorageData, currentSongData } = useContext(AppContext);

  const [songPos, setSongPos] = useState(0);

  const currentSongPosition = calculateTime(songPos);
  const songDuration =
    localStorageData && localStorageData.preferences.showSongRemainingTime
      ? currentSongData.duration - Math.floor(songPos) >= 0
        ? calculateTime(currentSongData.duration - Math.floor(songPos))
        : calculateTime(0)
      : calculateTime(currentSongData.duration);

  return (
    <div className="seekbar-and-song-durations-container flex h-1/3 w-full max-w-xl flex-row items-center justify-between text-sm">
      <div className="current-song-duration w-16 text-center font-light">
        {currentSongPosition.minutes}:{currentSongPosition.seconds}
      </div>
      <div className="seek-bar relative flex h-fit w-4/5 items-center rounded-md">
        <SeekBarSlider
          id="seek-bar-slider"
          name="seek-bar-slider"
          onSeek={(currentPosition) => setSongPos(currentPosition)}
        />
      </div>
      <div className="full-song-duration w-16 text-center text-sm font-light">
        {localStorageData && localStorageData.preferences.showSongRemainingTime ? '-' : ''}
        {songDuration.minutes}:{songDuration.seconds}
      </div>
    </div>
  );
};

export default SeekBarContainer;

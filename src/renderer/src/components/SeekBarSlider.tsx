import React from 'react';
import { AppContext } from '../contexts/AppContext';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import calculateTime from '../utils/calculateTime';
import debounce from '../utils/debounce';

type Props = {
  id: string;
  name: string;
  className?: string;
  sliderOpacity?: number;
  onSeek?: (currentPosition: number) => void;
};

const SeekBarSlider = (props: Props) => {
  const { localStorageData, currentSongData } = React.useContext(AppContext);
  const { updateSongPosition } = React.useContext(AppUpdateContext);

  const { id, name, className, sliderOpacity, onSeek } = props;

  const [songPos, setSongPos] = React.useState(0);
  const isMouseDownRef = React.useRef(false);
  const isMouseScrollRef = React.useRef(false);
  const seekbarRef = React.useRef(null as HTMLInputElement | null);
  const lowResponseSongPositionRef = React.useRef(0);

  const seekBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songPos /
      ((currentSongData.duration || 0) >= songPos ? currentSongData.duration || 0 : songPos)) *
    100
  }%`;
  if (sliderOpacity !== undefined) seekBarCssProperties['--slider-opacity'] = `${sliderOpacity}`;

  const handleSongPositionChange = React.useCallback((e: Event) => {
    if ('detail' in e && typeof e.detail === 'number') {
      const songPosition = e.detail as number;

      lowResponseSongPositionRef.current = songPosition;
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('player/positionChange', handleSongPositionChange);

    return () => document.removeEventListener('player/positionChange', handleSongPositionChange);
  }, [handleSongPositionChange]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      if (seekbarRef.current && !isMouseDownRef.current && !isMouseScrollRef.current) {
        setSongPos(lowResponseSongPositionRef.current);
        if (onSeek) onSeek(lowResponseSongPositionRef.current);
      }
    }, 500);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React.useEffect(() => {
  //   if (
  //     seekbarRef.current &&
  //     !isMouseDownRef.current &&
  //     !isMouseScrollRef.current
  //   ) {
  //     setSongPos(songPosition);
  //     if (onSeek) onSeek(songPosition);
  //   }
  //   //  ? Adding onSeek as a dependency makes the slider unresponsive while sliding for short times.
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [songPosition]);

  React.useEffect(() => {
    const seekBar = seekbarRef.current;

    if (seekbarRef.current) {
      const handleSeekbarMouseDown = () => {
        isMouseDownRef.current = true;
      };
      const handleSeekbarMouseUp = () => {
        isMouseDownRef.current = false;
        updateSongPosition(seekbarRef.current?.valueAsNumber ?? 0);
      };
      seekbarRef.current.addEventListener('mousedown', () => handleSeekbarMouseDown());
      seekbarRef.current.addEventListener('mouseup', () => handleSeekbarMouseUp());
      return () => {
        seekBar?.removeEventListener('mouseup', handleSeekbarMouseUp);
        seekBar?.removeEventListener('mousedown', handleSeekbarMouseDown);
      };
    }
    return undefined;
  }, [updateSongPosition]);

  const currentSongPosition = calculateTime(songPos);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = e.currentTarget.valueAsNumber;
    setSongPos(pos);
    if (onSeek) onSeek(pos);
  };

  const handleOnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    isMouseScrollRef.current = true;

    const max = parseInt(e.currentTarget.max);
    const scrollIncrement = localStorageData.preferences.seekbarScrollInterval;

    const incrementValue = e.deltaY > 0 ? -scrollIncrement : scrollIncrement;
    let value = (songPos || 0) + incrementValue;

    if (value > max) value = max;
    if (value < 0) value = 0;
    if (onSeek) onSeek(value);
    setSongPos(value);

    debounce(() => {
      isMouseScrollRef.current = false;
      updateSongPosition(value);
    }, 250);
  };

  return (
    <input
      type="range"
      name={name}
      id={id}
      className={
        className ||
        "seek-bar-slider relative float-left m-0 h-6 w-full appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
      }
      min={0}
      max={(currentSongData.duration || 0) >= songPos ? currentSongData.duration || 0 : songPos}
      value={songPos || 0}
      onChange={handleOnChange}
      onWheel={handleOnWheel}
      ref={seekbarRef}
      style={seekBarCssProperties}
      title={`${currentSongPosition.minutes}:${currentSongPosition.seconds}`}
    />
  );
};

export default SeekBarSlider;
